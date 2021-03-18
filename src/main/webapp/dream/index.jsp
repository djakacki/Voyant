<% request.setAttribute("title", "DREaM - Distant Reading Early Modernity"); %>
<%@ include file="../resources/jsp/html_head.jsp" %>

<link href='http://fonts.googleapis.com/css?family=Cinzel+Decorative:400,900' rel='stylesheet' type='text/css'>
<style>
	.dream-body {
		background-image: url(dream-tp-transparent.png);
		background-size: cover;
	}
	.dream-body .x-panel-body-default {
		background: none;
	}
	.dream-body header {
		font-family: 'Cinzel Decorative', cursive;
	}
	.dream-body h1 {
		font-size: 600%;
		margin-bottom: 35px;
	}
	table.intro {
		margin-left: auto;
		margin-right: auto;
		max-width: 125em;
	}
	table.intro td {
		padding: 1em;
		vertical-align: top;
	}
</style>

<%@ include file="../resources/jsp/head_body.jsp" %>

<script>
	Ext.Loader.setConfig({
		enabled : true,
		paths : {
			'Voyant' : '../app',
			'resources': '../resources'
		}
	});

	Ext.application({
		extend : 'Voyant.VoyantCorpusApp',
		requires: ['Voyant.panel.Subset'],
		name: 'VoyantDreamApp',
		config: {
			baseUrl: '<%= org.voyanttools.voyant.Voyant.getBaseUrlString(request) %>',
			version: '<%= application.getInitParameter("version") %>',
			build: '<%= application.getInitParameter("build") %>',
			allowInput: 'false' // assume that this is always pre-built		
		},
		statics: {
	    	i18n: {
	    		pubDateTip: {en: "Workset Builder"},
	    		pubDate: {en: "Publication Year"},
	    		pubDateCountTip: {en: "This is the number of documents whose publication year matches the specified range."},
	    		pubDateHelpTip: {en: "Use the slider to determine the start and end year range of publications."}
	    	}
		},
		validateCorpusLoadParams: function(params) {
			params.docsLimit=0
		},
	    launch: function(config) {

	    	if (!this.hasQueryToLoad()) {
		    	location.replace("?corpus=dream")
	    	}

			// get current markup and then dispose of it
			var headerEl = document.querySelector("body > section");
			var introHtml = headerEl.outerHTML;
			headerEl.remove();
			
			var me = this;

			
			Ext.create('Ext.container.Viewport', {
			    layout: 'fit',
			    cls: 'dream-body',
			    items: [{
				    xtype: 'subset',
            		inDocumentsCountOnly: true,
            		stopList: 'stop.en.taporware.txt',
				    header: false,
				    title: false,
			    	autoScroll: true,
				    margin: '0, 40, 20, 40',
				    introHtml: introHtml,
				    listeners: {
					    loadedCorpus: function(src, corpus) {
						    // make sure corpus is set
						    this.getStore().setCorpus(corpus);
						    var slider = this.down('multislider');
						    slider.fireEvent("changecomplete", slider)
						}
					},
				    handleExport: function(a, b, withBadPassword) {
					    var corpus = this.getStore().getCorpus();
					    if (corpus && corpus.getNoPasswordAccess()=='NONCONSUMPTIVE' && !this.getCorpusAccessValidated()) {
						    return Ext.Msg.prompt("Access Code Required", (withBadPassword ? "<p style='color: red'>"+me.localize('badPassword')+"</p>" : '') + "<p>Access to this corpus is restricted. Please provide a valid access code to continue with the download.</p>", function(btn, code) {
								if (btn=='ok' && code.trim().length>0) {
									this.mask("Verifying password…");
		                    		Ext.Ajax.request({
		                    			  url: me.getTromboneUrl(),
		                    			  params: {
		                    				  corpus: corpus.getId(),
		                    				  passwordForSession: code
		                    			  },
		                    			  method: 'POST',
		                    			  success: function(result, request) {
		                    				  this.unmask();
		                    				  var access = result.responseText;
		                    				  if (access=="ADMIN" || access=="ACCESS") {
			                    				  this.setCorpusAccessValidated(true);
			                    				  this.handleExport(); // try again with password set
		                    				  }
		                    				  else {
			                    				  this.handleExport(a, b, true);
		                    				  }
		                    			  },
		                    			  failure: function(result, request) {
		                    				  this.unmask();
		  		                    			this.showError({
				                    				message: me.localize('passwordValidationError')
				                    			})
		                    			  },
		                    			  scope: this 
		                    		});
										
								}
							}, this); 
						}
				    	if (!this.getStore().lastOptions || !this.getStore().lastOptions.params.query) {
					    	this.showMsg({message: "No queries have been selected, please select a subset of documents by specifying at least one query."});
				    	} else {
					    	var record = this.getStore().getAt(0);
					    	if (record) {
						    	if (record.getCount()==0) {
							    	return this.showMsg({message: "The current query criteria don't match any documents, please modifying the search first."});
							    }
						    	else if (record.getCount()>1000) {
							    	return this.showMsg({message: "Too many matching documents to export, please specify a query that matches fewer than 1,000 documents."});
							    } else {
							    	this.getStore().load({
							    		params: {
							    			query: this.getStore().lastOptions.params.query,
							    			createNewCorpus: true,
							    			temporaryCorpus: true
							    		},
							    		callback: function(records, operation, success) {
							    			if (success && records && records.length==1) {
							    	    		this.downloadFromCorpusId(operation.getProxy().getReader().metaData);
							    			}
							    		},
							    		scope: this
							    	})
								}
						    }
				    	}
				    },
				    fieldItems: [{
		        		xtype: 'querysearchfield',
		        		tokenType: 'title'
	        		},{
		        		xtype: 'querysearchfield',
		        		tokenType: 'author'
	        		},{
		        		xtype: 'querysearchfield'
	        		},{
		        		xtype: 'querysearchfield',
		        		tokenType: 'publisher'
	        		},{
		        		layout: 'hbox',
		        		tokenType: 'pubDate',
 		        		width: 340,
		        		items: [{
			        		xtype: 'container',
			        		html: this.localize('pubDate'),
			        		cls: 'x-form-item-label x-form-item-label-default x-form-item-label-right x-unselectable x-form-item-label-default',
			        		width: 105
			        	},{
				        	flex: 1,
				        	layout: 'hbox',
				        	cls: "x-form-trigger-wrap x-form-trigger-wrap-default",
			        		bodyStyle: 'background-color: white; padding-left: 5px',
				        	items: [{
				        		xtype: 'multislider',
						        minValue: 1450,
						        maxValue: 1700,
						        values: [ 1450, 1700 ],
//						        width: 200
						        flex: 1,
						        getValue: function() {
							        var values = this.getValues();
							        return this.minValue==values[0] && this.maxValue==values[1] ? "" : '['+values.join("-")+"]"
							    },
							    getTokenType: function() {return 'pubDate'},
						        listeners: {
							        changecomplete: function(slider) {
								        var query = this.getValue();
								        if (query) {query = this.getTokenType()+':'+query;}
							        	var subset = slider.up('subset');
							    		subset.fireEvent("query", me, [query]);
							        	var countEl = Ext.get(slider.ownerCt.getTargetEl().dom.querySelector('.form-fa-count-trigger'));
							        	countEl.setHtml(query.length>0 ? '0' : subset.getStore().getCorpus().getDocumentsCount())
							        	countEl.show();
							        	if (query) {
						    				subset.getStore().getCorpus().getCorpusTerms().load({
						    					params: {
						    						query: query,
									    			tokenType: 'pubDate',
									    			inDocumentsCountOnly: true
						    					},
						    					callback: function(records, operation, success) {
						    						if (success && records && records.length==1) {
						    							countEl.setHtml(Ext.util.Format.number(records[0].getInDocumentsCount(), '0,000'))
							    						slider.ownerCt.updateLayout()
						    						}
						    					}
						    				})
								        }
								    }
						    	},
						    	scope: this
					        },{
						        	html: '<div><div class="x-form-text-wrap x-form-text-wrap-default" style="height: 22px">'+
						        		'<div class="x-form-trigger x-form-trigger-default form-fa-count-trigger fa-trigger fa-trigger-default" style="display: none;"></div>'+
						        		'<div class="x-form-trigger x-form-trigger-default fa-trigger form-fa-help-trigger fa-trigger form-fa-help-trigger-default" style="height: 22px;"></div>'+
						        		'</div></div>',
						        	listeners: {
							        	afterrender: function(cmp) {
								        	var subset = cmp.up('subset');
								        	var count = Ext.get(cmp.getTargetEl().dom.querySelector(".form-fa-count-trigger"));
								        	Ext.tip.QuickTipManager.register({
								                 target: count,
								                 text: me.localize('pubDateCountTip')
								             });
								        	count.on("click", function() {
						    	            	Ext.Msg.show({
						    	            	    title: me.localize('pubDate'),
						    	            	    message: me.localize('pubDateCountTip'),
						    	            	    buttons: Ext.OK,
						    	            	    icon: Ext.Msg.INFO
						    	            	});
									        });
								        	var help = Ext.get(cmp.getTargetEl().dom.querySelector(".form-fa-help-trigger"));
								        	Ext.tip.QuickTipManager.register({
								                 target: help,
								                 text: me.localize('pubDateHelpTip')
								             });
								        	help.on("click", function() {
						    	            	Ext.Msg.show({
						    	            	    title: me.localize('pubDate'),
						    	            	    message: me.localize('pubDateHelpTip'),
						    	            	    buttons: Ext.OK,
						    	            	    icon: Ext.Msg.INFO
						    	            	});
									        });
								        }
						        	},
						        	scope: this
					        }]
			        	}]
		        	}, {
			        		xtype: 'checkboxfield',
			        		fieldLabel: '&nbsp;',
		                    boxLabel  : 'use orthographic variants in full-text search',
		                    name      : 'variants',
		                    inputValue: 'true',
		                    checked   : true
			        	}]
			    }]
			});

			config = config || {};
			config.useCache=true
			this.callParent([config]);

		}
	});
</script>

<section>
	<header>
		<table style="width: 100%">
			<tr>
				<td align="right" style="width: 50%">
					<table>
						<tr>
							<td style="text-align: center">
								<h1>DREaM</h1>
								<h3>Distant Reading Early Modernity</h3>
							</td>
						</tr>
					</table>
				</td>
				<td style="width: 2em">&nbsp:</td>
				<td>
					<img src="EMC_WebDigital.gif" style="height: 100px;" alt="Early Modern Conversions" />
					<img src="voyant-tools.png" style="height: 100px; margin-right: 1em;" alt="Voyant Tool" />
				</td>			
			</tr>
		</table>
	</header>
	<section>
	<table id='intro'>
		<tr>
			<td>The DREaM Database indexes 44,000+ early modern texts, thus making long-neglected material more amenable to marco-scale textual analysis. The corpus comprises approximately one-third of all the titles in the Stationer&rsquo;s Register and all of the texts transcribed thus far by the <a href='http://www.textcreationpartnership.org' target='_blank'>Text Creation Partnership</a>, an initiative that aims to create standardized, accurate XML/SGML encoded full text editions of all documents available from <a href='http://eebo.chadwyck.com/home' target='_blank'>Early English Books Online</a>.</td>
			<td style="width: 2em">&nbsp:</td>
			<td>Unlike similar databases, DREaM enables mass downloading of custom-defined subsets rather than obliging users to download individual texts one-by-one. In other words, it functions at the level of &lsquo;sets of texts,&rsquo; rather than &lsquo;individual texts.&rsquo; Examples of subsets one might potentially generate include &lsquo;all texts by Ben Jonson,&rsquo; &lsquo;all texts published in 1623,&rsquo; or &lsquo;all texts printed by John Wolfe.&rsquo; The subsets are available as either plain text or XML encoded files, and users have the option to automatically name individual files by date, author, title, or combinations thereof. There is also an option to download subsets in the original spelling, or in an automatically normalized version.</td>
		</tr>
	</table>
	</section>
</section>

</body>
</html>