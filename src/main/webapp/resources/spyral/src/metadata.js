/**
 * A class for storing Notebook metadata
 * @memberof Spyral
 */
class Metadata {
	/**
	 * The Metadata config object
	 * @typedef {Object} MetadataConfig
	 * @property {String} title The title of the Corpus
	 * @property {String} author The author of the Corpus
	 * @property {String} description The description of the Corpus
	 * @property {Array} keywords The keywords for the Corpus
	 * @property {String} created When the Corpus was created
	 * @property {String} language The language of the Corpus
	 * @property {String} license The license for the Corpus
	 */

	/** 
	 * The metadata constructor.
	 * @constructor
	 * @param {MetadataConfig} config The metadata config object
	 */
	constructor(config) {
		['title', 'author', 'description', 'keywords', 'modified', 'created', 'language', 'license'].forEach(key => {
			this[key] = '';
		})
		this.version = "0.1"; // may be changed by config
		if (config instanceof HTMLDocument) {
			config.querySelectorAll("meta").forEach(function(meta) {
				var name =  meta.getAttribute("name");
				if (name && this.hasOwnProperty(name)) {
					var content = meta.getAttribute("content");
					if (content) {
						this[name] = content;
					}
				}
			}, this);
		} else {
			this.set(config);
		}
		if (!this.created) {this.setDateNow("created")}
	}

	/**
	 * Set metadata properties.
	 * @param {Object} config A config object
	 */
	set(config) {
		for (var key in config) {
			if (this.hasOwnProperty(key)) {
				this[key] = config[key];
			}
		}
	}

	/**
	 * Sets the specified field to the current date and time.
	 * @param {String} field 
	 */
	setDateNow(field) {
		this[field] = new Date().toISOString();
	}

	/**
	 * Gets the specified field as a short date.
	 * @param {String} field
	 * @returns {(String|undefined)}
	 */
	shortDate(field) {
		return this[field] ? (new Date(Date.parse(this[field])).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })) : undefined;
	}

	/**
	 * Gets the fields as a set of HTML meta tags.
	 * @returns {String}
	 */
	getHeaders() {
		var quotes = /"/g, newlines = /(\r\n|\r|\n)/g, tags = /<\/?\w+.*?>/g,
			headers = "<title>"+(this.title || "").replace(tags,"")+"</title>\n"
		for (var key in this) {
			if (this[key]) {
				headers+='<meta name="'+key+'" content="'+this[key].replace(quotes, "&quot;").replace(newlines, " ")+'">';
			}
		}
		return headers;
	}

	/**
	 * Returns a clone of this Metadata
	 * @returns {Spyral.Metadata}
	 */
	clone() {
		let config = {};
		Object.assign(config, this);
		return new Metadata(config);
	}


}

export { Metadata }
