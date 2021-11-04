package org.voyanttools.voyant;

import java.io.File;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.AccessController;
import java.security.PrivilegedAction;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;

import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.http.NameValuePair;
import org.apache.http.client.utils.URLEncodedUtils;
import org.voyanttools.trombone.input.source.InputSourcesBuilder;
import org.voyanttools.trombone.util.FlexibleParameters;

/**
 * This is a utility class for instantiating {@link FlexibleParameters} from {@link HttpServletRequest}s.
 * @author Stéfan Sinclair, Cyril Briquet
 */
public class FlexibleParametersFactory {
	
	private String build;
	private String version;

	public FlexibleParametersFactory(ServletContext servlet) {
		this.build = servlet.getInitParameter("build");
		this.version = servlet.getInitParameter("version");
	}

	/**
	 * Get an instance of {@link FlexibleParameters} from the {@link HttpServletRequest}.
	 * 
	 * <p>This method handles simple forms as wells as multipart forms with file uploads.</p>
	 * @param request
	 * @return {@link FlexibleParameters} instance
	 * @throws Exception
	 */
	public FlexibleParameters getInstance(HttpServletRequest request) throws Exception {

		return getInstance(request, false);
	
	}
	
	/**
	 * Get an instance of {@link FlexibleParameters} from the {@link HttpServletRequest}.
	 * 
	 * <p>This method handles simple forms as wells as multipart forms with file uploads.</p>
	 * @param request
	 * @return {@link FlexibleParameters} instance
	 * @throws Exception
	 */
	@SuppressWarnings("restriction")
	public FlexibleParameters getInstance(HttpServletRequest request, boolean allowLocalFileSystemAccess) throws Exception {

		if (request == null) {
			throw new NullPointerException("illegal request");
		}
		
		final FlexibleParameters parameters = new FlexibleParameters();
		parameters.setParameter("VOYANT_VERSION", version!=null ? version : "");
		parameters.setParameter("VOYANT_BUILD", build!=null ? build : "");
		parameters.setParameter("VOYANT_REMOTE_ID", request.getHeader("X-FORWARDED-FOR")!=null ? request.getHeader("X-FORWARDED-FOR") : request.getRemoteAddr());

		final HttpParametersDecoder parametersDecoder = new HttpParametersDecoder(parameters);
		
		if (ServletFileUpload.isMultipartContent(request) && !(request instanceof Voyant.PostedInputRequestWrapper)) {
			final List<FileItem> items = getRequestItems(request);
			String tmpDir = AccessController.doPrivileged((PrivilegedAction<String>) () -> System.getProperty("java.io.tmpdir"));
			Path tmpPath = Paths.get(tmpDir, "tmp.voyant.uploads");
			if (!Files.exists(tmpPath)) {
				Files.createDirectory(tmpPath);
			}
			
			for (FileItem item : items) {
				if (item.isFormField()) { // normal form field
					parametersDecoder.decodeParameter(item.getFieldName(), item.getString("UTF-8"), allowLocalFileSystemAccess);
				}
				else { // file form field: this is uploaded, therefore the local access check can be bypassed
					Path path = Files.createTempDirectory(tmpPath, "tmp.voyant.uploads");
					File file = new File(path.toFile(), item.getName());
					item.write(file);
					parametersDecoder.decodeParameter("upload", file.toString(), true);
				}
			}
		}
		else {
			if (request.getMethod().equals("GET")) {
				// I couldn't for the life of me convince a GET request to use the specified character encoding (tried req.setCharacterEncoding() etc.)
				// so we'll not use the simpler request.getParameterMap() and instead parse the query string ourselves
				String queryString = request.getQueryString();
				if (queryString!=null) {
					List<NameValuePair> pairs = URLEncodedUtils.parse(request.getQueryString(), Charset.forName("UTF-8"));
					for (NameValuePair pair : pairs) {
						if (pair.getName().equals("_dc")==false) { // ignore the EXTJS param for GET requests
							parametersDecoder.decodeParameters(pair.getName(), new String[]{pair.getValue()}, allowLocalFileSystemAccess);
						}
					}
				}
			}
			else {
				for (Map.Entry<String, String[]> param : ((Map<String, String[]>) request.getParameterMap()).entrySet()) {
					parametersDecoder.decodeParameters(param.getKey(), param.getValue(), allowLocalFileSystemAccess || (request instanceof Voyant.PostedInputRequestWrapper && param.getKey().equals("upload")));
				}		
			}
		}
		
		// check to see if this instance allows new input
		if (System.getProperty("org.voyanttools.server.allowinput", "true").equals("false") && InputSourcesBuilder.hasParameterSources(parameters)) {
			throw new IllegalArgumentException("This server has been configured to refuse new input.");
		}
		
		return parameters;
	
	}
	
	private static List<FileItem> getRequestItems(HttpServletRequest request) throws FileUploadException {
		
		if (request == null) {
			throw new NullPointerException("illegal request");
		}
		
		final DiskFileItemFactory factory = new DiskFileItemFactory();
		final ServletFileUpload upload = new ServletFileUpload(factory);
		final List<FileItem> items = upload.parseRequest(request);

		return items;
		
	}

}
