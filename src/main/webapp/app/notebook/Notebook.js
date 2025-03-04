/*
 * @class Notebook
 * A Spyral Notebook. This should never be instantiated directly.
 */
Ext.define('Voyant.notebook.Notebook', {
	alternateClassName: ["Notebook"],
	extend: 'Ext.panel.Panel',
	requires: ['Voyant.notebook.editor.CodeEditorWrapper','Voyant.notebook.editor.TextEditorWrapper','Voyant.notebook.metadata.MetadataEditor','Voyant.notebook.StorageDialogs','Voyant.notebook.github.GitHubDialogs'],
	mixins: ['Voyant.panel.Panel','Voyant.notebook.util.FormatConverter'],
	alias: 'widget.notebook',
    statics: {
    	i18n: {
    		title: "Spyral",
    		created: "Created",
    		modified: "Modified",
    		clickToEdit: "Click to edit",
    		errorLoadingNotebook: "Error loading Spyral notebook",
    		cannotLoadJson: "Unable to parse JSON input.",
    		cannotLoadJsonUnrecognized: "Unable to recognize JSON input.",
    		cannotLoadUnrecognized: "Unable to recognize input.",
			cannotLoadNotebookId: "Unable to load the Spyral Notebook. It may no longer exist.",
    		openTitle: "Open",
    		openMsg: "Paste in Notebook ID, a URL or a Spyral data file (in HTML).",
    		exportHtmlDownload: "HTML (download)",
    		errorParsingDomInput: "An error occurred while parsing the input of the document. The results might still work, except if the code contained HTML tags.",
			metadataEditor: "Edit Metadata",
    		metadataReset: "Reset",
    		metadataSave: "Save",
    		metadataCancel: "Cancel",
			preparingExport: "Preparing Export"
    	},
    	api: {
    		input: undefined,
    		inputEncodedBase64Json: undefined,
    		run: undefined
    	}
    },
    config: {
        /**
         * @private
         */
    	notebookId: undefined,
        /**
         * @private
         */
    	metadata: undefined,
        /**
         * @private
         */
    	isEdited: false,
    	/**
    	 * @private
    	 */
    	version: "3.0",
		/**
		 * @private
		 * Which solution to use for storing notebooks, either: 'voyant' or 'github'
		 */
		storageSolution: 'voyant'
	},
	
	metadataWindow: undefined,
	voyantStorageDialogs: undefined,
	githubDialogs: undefined,
	catalogueWindow: undefined,

	// holds the content of the tern docs, for passing to the code editor
	spyralTernDocs: undefined,
	ecmaTernDocs: undefined,
	browserTernDocs: undefined,
    
    /**
     * @private
     */
    constructor: function(config) {
    	Ext.apply(config, {
    		title: this.localize('title'),
    		includeTools: {
				'help': true,
				'gear': true,
    			'save': true,
    			'saveIt': {
    				tooltip: this.localize("saveItTip"),
    				itemId: 'saveItTool',
    				xtype: 'toolmenu',
    				glyph: 'xf0c2@FontAwesome',
					disabled: true,
					items: [{
						text: 'Save',
						xtype: 'menuitem',
						glyph: 'xf0c2@FontAwesome',
						handler: this.showSaveDialog.bind(this, false),
						scope: this
					},{
						text: 'Save As...',
						xtype: 'menuitem',
						glyph: 'xf0c2@FontAwesome',
						handler: this.showSaveDialog.bind(this, true),
						scope: this
					},'-',{
						text: 'Storage',
						xtype: 'menuitem',
						menu: {
							items: [{
								text: 'Voyant',
								xtype: 'menucheckitem',
								group: 'storageSolution',
								checked: true,
								handler: this.setStorageSolution.bind(this, 'voyant'),
								scope: this
							},{
								text: 'GitHub',
								xtype: 'menucheckitem',
								group: 'storageSolution',
								checked: false,
								handler: this.setStorageSolution.bind(this, 'github'),
								scope: this
							}]
						}
					}]
    			},
    			'new': {
    				tooltip: this.localize("newTip"),
    				callback: function() {
    	    			let url = this.getBaseUrl()+"spyral/";
						this.getApplication().openUrl(url);
    				},
    				xtype: 'toolmenu',
    				glyph: 'xf067@FontAwesome',
    				scope: this
    			},
    			'open': {
    				tooltip: this.localize("openTip"),
    				xtype: 'toolmenu',
					glyph: 'xf115@FontAwesome',
					callback: function(panel, tool) {
						const storageSolution = this.getStorageSolution();
						if (storageSolution === undefined) {
						} else {
							setTimeout(() => {
								tool.toolMenu.hide()
							})
							if (storageSolution === 'github') {
								this.githubDialogs.showLoad();
							} else {
								Ext.Msg.prompt(this.localize("openTitle"),this.localize("openMsg"),function(btn, text) {
									text = text.trim();
									if (btn=="ok") {
										this.loadFromString(text);
									}
								}, this, true);
							}
						}
					},
					scope: this,
					items: [{
						text: 'Load',
						xtype: 'menuitem',
						glyph: 'xf115@FontAwesome',
						handler: function() {
							Ext.Msg.prompt(this.localize("openTitle"),this.localize("openMsg"),function(btn, text) {
								text = text.trim();
								if (btn=="ok") {
									this.loadFromString(text);
								}
							}, this, true);
						},
						scope: this
					},{
						text: 'Load from GitHub',
						xtype: 'menuitem',
						glyph: 'xf115@FontAwesome',
						handler: function() {
							this.githubDialogs.showLoad();
						},
						scope: this
					}]
    			},
    			'runall': {
    				tooltip: this.localize("runallTip"),
    				callback: this.runAll,
    				xtype: 'toolmenu',
    				glyph: 'xf04e@FontAwesome',
    				scope: this
    			},
    			'metadata': {
    				tooltip: this.localize("metadataTip"),
    				callback: this.showMetadataEditor,
					xtype: 'toolmenu',
					glyph: 'xf02c@FontAwesome',
					scope: this
    			},
                'catalogue': {
                    tooltip: 'catalogue',
                    callback: function() {
                        this.catalogueWindow.showWindow();
                    },
                    xtype: 'toolmenu',
                    glyph: 'xf00b@FontAwesome',
                    scope: this
                }
    		},
    		
			scrollable: true,
			layout: {
				type: 'vbox',
				align: 'middle',
				padding: '50 0'
			},
			defaults: {
				width: '100%',
				maxWidth: 1100
			},
    		items: [{
    			itemId: 'spyralHeader',
    			cls: 'spyral-header',
    			listeners: {
    				afterrender: function(header) {
    					Ext.tip.QuickTipManager.register({
    						  target: header.getId(),
    						  text: this.localize("clickToEdit")
    						});
    					var head = header;
    					header.getTargetEl().on("click", function(header) {
    						this.showMetadataEditor();
    						head.removeCls("editable");
    					}, this);
    					header.mon(header.getEl(), "mouseover", function() {header.addCls("editable")});
    					header.mon(header.getEl(), "mouseout", function() {header.removeCls("editable")});
    				},
    				scope: this
    			}
    		},{
    			xtype: 'container',
    			itemId: 'cells',
				defaults: {
					margin: '10 0 10 0',
					padding: '0 50 0 50'
				}
    		},{
    			itemId: 'spyralFooter',
    			cls: 'spyral-footer',
    			listeners: {
    				afterrender: function(footer) {
    					Ext.tip.QuickTipManager.register({
  						  target: footer.getId(),
  						  text: this.localize("clickToEdit")
  						});
    					var foot = footer;
    					footer.getTargetEl().on("click", function(footer) {
    						this.showMetadataEditor();
    						foot.removeCls("editable");
    					}, this);
    					footer.mon(footer.getEl(), "mouseover", function() {footer.addCls("editable")});
    					footer.mon(footer.getEl(), "mouseout", function() {footer.removeCls("editable")});
    				},
    				scope: this
    			}
    		}],
    		listeners: {
    			afterrender: this.init,
    			notebookWrapperMoveUp: this.notebookWrapperMoveUp,
    			notebookWrapperMoveDown: this.notebookWrapperMoveDown,
    			notebookWrapperRemove: this.notebookWrapperRemove,
				notebookWrapperAdd: this.notebookWrapperAdd,
				notebookInitialized: this.notebookInitialized,
    			scope: this
    		}
    	})

        this.callParent(arguments);
    	this.mixins['Voyant.panel.Panel'].constructor.apply(this, arguments);
		this.mixins['Voyant.notebook.util.FormatConverter'].constructor.apply(this, arguments);

		this.voyantStorageDialogs = new Voyant.notebook.StorageDialogs({
			listeners: {
				'fileLoaded': function(src) {

				},
				'fileSaved': function(src, notebookId) {
					this.unmask();
					if (notebookId !== null) {
						var id = this.getNotebookId();
						if (!id || notebookId!=id) {
							this.setNotebookId(notebookId);
						}
						this.toastInfo({
							html: this.localize('saved'),
							anchor: 'tr'
						});
						this.setIsEdited(false);
					} else {
						// save error
					}
				},
				'saveCancelled': function() {
				},
				'close': function() {
					this.unmask();
				},
				scope: this
			}
		});

		this.githubDialogs = new Voyant.notebook.github.GitHubDialogs({
			listeners: {
				'fileLoaded': function(src, {owner, repo, ref, path, file}) {
					this.githubDialogs.close();
					this.loadFromString(file);

					const id = encodeURIComponent(owner+'/'+repo+'/'+path);
					if (location.search.indexOf(id) === -1) {
						const url = this.getBaseUrl()+'spyral/?githubId='+id;
						window.history.pushState({
							url: url
						}, 'Spyral Notebook: '+id, url);
					}
				},
				'fileSaved': function(src, {owner, repo, branch, path}) {
					this.githubDialogs.close();
					this.unmask();
					this.toastInfo({
						html: this.localize('saved'),
						anchor: 'tr'
					});
					this.setIsEdited(false);

					const id = encodeURIComponent(owner+'/'+repo+'/'+path);
					if (location.search.indexOf(id) === -1) {
						const url = this.getBaseUrl()+'spyral/?githubId='+id;
						window.history.pushState({
							url: url
						}, 'Spyral Notebook: '+id, url);
					}
				},
				'saveCancelled': function(src) {
					this.unmask();
				},
				scope: this
			}
		});

		this.catalogueWindow = new Voyant.notebook.Catalogue({
			listeners: {
				notebookSelected: function(catalogue, notebookId) {
					catalogue.hideWindow();
					this.loadFromId(notebookId);
					this.setNotebookId(notebookId);
				},
				scope: this
			}
		});
    },
    
    init: function() {
		window.onbeforeunload = function() {
			if (this.getIsEdited()) {
				return ''; // return any string to prompt the browser to warn the user they have unsaved changes
			}
		}.bind(this);

		// need to load docs first
		Ext.Promise.all([
			Ext.Ajax.request({url: this.getApplication().getBaseUrlFull()+'resources/spyral/docs/spyral.json'}),
			Ext.Ajax.request({url: this.getApplication().getBaseUrlFull()+'resources/spyral/docs/ecmascript.json'}),
			Ext.Ajax.request({url: this.getApplication().getBaseUrlFull()+'resources/spyral/docs/browser.json'})
		]).then(function(responses) {
			this.spyralTernDocs = Ext.JSON.decode(responses[0].responseText);
			// add docs for static / global functions TODO automate this at doc creation
			this.spyralTernDocs.Corpus = this.spyralTernDocs.Spyral.Corpus;
			this.spyralTernDocs.Table = this.spyralTernDocs.Spyral.Table;
			this.spyralTernDocs.loadCorpus = this.spyralTernDocs.Spyral.Corpus.load;
			this.spyralTernDocs.createTable = this.spyralTernDocs.Spyral.Table.create;
			this.spyralTernDocs.show = this.spyralTernDocs.Spyral.Util.show;
			this.spyralTernDocs.showError = this.spyralTernDocs.Spyral.Util.showError;
			
			this.ecmaTernDocs = Ext.JSON.decode(responses[1].responseText);
			this.browserTernDocs = Ext.JSON.decode(responses[2].responseText);

			this.loadFromQueryParams();
		}.bind(this), function() {
			this.loadFromQueryParams();
		}.bind(this))
    },
    
    
    reset: function() {
		this.getScrollable().scrollTo(0, 0);
		this.getScrollable().trackingScrollTop = 0;
		this.getScrollable().trackingScrollLeft = 0;

		this.setMetadata(new Spyral.Metadata());
		this.voyantStorageDialogs.reset();
    	var cells = this.getComponent("cells");
    	cells.removeAll();
	},

	showSaveDialog: function(saveAs) {
		this.mask(this.localize('saving'));
		this.getMetadata().setDateNow("modified");

		this.updateCachedOutput().then(function(result) {	
		}, function(err) {
			console.warn('Error updating cached results');
		}).finally(function() {
			var data = this.generateExportJson();
			var metadata = this.generateExportMetadata(this.getMetadata());
	
			var storageSolution = this.getStorageSolution();
			
			if (!saveAs && storageSolution === 'voyant' && this.getNotebookId() !== undefined && this.voyantStorageDialogs.getAccessCode() !== undefined) {
				this.voyantStorageDialogs.doSave({
					notebookId: this.getNotebookId(),
					data: data,
					metadata: metadata,
					accessCode: this.voyantStorageDialogs.getAccessCode()
				});
			} else {
				if (storageSolution === 'github') {
					this.githubDialogs.showSave(data);
				} else {
					this.voyantStorageDialogs.showSave(data, metadata, saveAs ? undefined : this.getNotebookId());
				}
			}
		}.bind(this));
	},

	updateCachedOutput: function() {
		return Ext.Promise.all(this.query('notebookrunnableeditorwrapper').map(function(cmp) {
			return cmp.results.updateCachedOutput();
		}));
	},

	exportToolClick: function(panel) {
		panel.mask(panel.localize('preparingExport'));
		panel.updateCachedOutput().finally(function() {
			panel.unmask();
			panel.mixins['Voyant.util.Toolable'].exportToolClick.call(this, panel);
		});
	},
	
	// override toolable method
	getExportUrl: function(asTool) {
		return location.href; // we just provide the current URL
	},

	loadFromQueryParams: function() {
		var queryParams = Ext.Object.fromQueryString(document.location.search, true);
		var isRun = Ext.isDefined(queryParams.run);
		var spyralIdMatches = /\/spyral\/([\w-]+)\/?$/.exec(location.pathname);
		var isGithub = Ext.isDefined(queryParams.githubId);
		if ("inputJsonArrayOfEncodedBase64" in queryParams) {
			let json = Ext.decode(decodeURIComponent(atob(queryParams.inputJsonArrayOfEncodedBase64)));
			json.forEach(function(block, index) {
				let text = block;
				if (text.trim().indexOf("<")==0) {
					if (index === 0) {
						// assume first text block is metadata
						this.setMetadata(new Spyral.Metadata({
							title: text
						}));
					} else {
						this.addText(text);
					}
				} else {
					this.addCode(text);
				}
			}, this);
		} else if (queryParams.input) {
			if (queryParams.input.indexOf("http")===0) {
				this.loadFromUrl(queryParams.input, isRun);
			}
		} else if (spyralIdMatches) {
			this.loadFromId(spyralIdMatches[1]);
			this.setStorageSolution('voyant');
		} else if (isGithub) {
			this.githubDialogs.loadFileFromId(queryParams.githubId);
			this.setStorageSolution('github');
		} else {
			this.addNew();
			this.setIsEdited(false);
		}
		
		if (isRun) {
			var me = this;
			Ext.defer(function() {
				me.runAll()
			}, 100)
		}
	},
	
    loadFromString: function(text) {
    	text = text.trim();
		if (text.indexOf("http") === 0) {
			this.loadFromUrl(text);
		} else if (text.indexOf("{") === 0) {
			this.loadFromJson(text);
		} else if (/^[\w-_]+$/.test(text)) {
			this.loadFromId(text)
		} else if (text.indexOf("<") !== 0 || text.indexOf("spyral") === -1) {
			return Ext.Msg.show({
				title: this.localize('errorLoadingNotebook'),
				msg: this.localize('cannotLoadUnrecognized'),
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.ERROR
			});
		} else {
			Ext.batchLayouts(function() {
				this.reset();
				this.importFromHtml(text); // old format
			}, this);
		}
		return true;
    },

	loadFromJson: function(text) {
		var json;
		try {
			json = JSON.parse(text)
		} catch(e) {
			return Ext.Msg.show({
				title: this.localize('errorLoadingNotebook'),
				msg: this.localize('cannotLoadJson')+"<br><pre style='color: red'>"+e+"</pre>",
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.ERROR
			});
		}

		if (!json.cells || !json.metadata) {
			return Ext.Msg.show({
				title: this.localize('errorLoadingNotebook'),
				msg: this.localize('cannotLoadJsonUnrecognized'),
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.ERROR
			});
		}

		Ext.batchLayouts(function() {
			this.reset();
			this.setMetadata(new Spyral.Metadata(json.metadata));

			var cells2Init = [];
			json.cells.forEach(function(cell) {
				var cell2Init = undefined;
				switch(cell.type) {
					case 'text':
						this.addText(cell.content, undefined, cell.cellId);
						break;
					case 'code':
						cell2Init = this.addCode(cell.content, undefined, cell.cellId);
						break;
					case 'data':
						cell2Init = this.addData(cell.content, undefined, cell.cellId);
						break;
				}
				if (cell2Init) {
					cell2Init.on('initialized', function() {
						var cellIndex = cells2Init.indexOf(cell2Init);
						if (cellIndex !== -1) {
							cells2Init.splice(cellIndex, 1);
							if (cells2Init.length === 0) {
								this.fireEvent('notebookInitialized', this);
							}
						} else {
							console.error('unknown cell initialized', cell2Init);
						}
					}.bind(this));
					cells2Init.push(cell2Init);
				}
			}, this);
		}, this);
	},

	loadFromUrl: function(url, run) {
    	var me = this;
    	// load as string and not HTML in case it's an older JSON format
    	Spyral.Load.text(url).then(function(text) {me.loadFromString(text)})
    },
    
    loadFromId: function(id) {
    	this.mask(this.localize("loading"));
    	var me = this;
    	Spyral.Load.trombone({
	    	 tool: 'notebook.GitNotebookManager',
	    	 action: 'load',
	    	 id: id,
	    	 noCache: 1
    	}).then(function(json) {
    		me.unmask();
    		me.loadFromString(json.notebook.data);
			if (json.notebook.id && json.notebook.id !== me.getNotebookId()) {
				me.setNotebookId(json.notebook.id);
			}
	    	me.setIsEdited(false);
    	}).catch(function(err) {
			me.unmask();
			Ext.Msg.show({
				title: me.localize('errorLoadingNotebook'),
				msg: me.localize('cannotLoadNotebookId'),
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.ERROR
			});
		});
    },
    
    runUntil: function(upToCmp) {
    	var containers = [];
    	Ext.Array.each(this.query("notebookrunnableeditorwrapper"), function(item) {
			containers.push(item);
    		if (upToCmp && upToCmp===item) {return false;}
    	}, this);
    	this._run(containers);
    },
    
    runFrom: function(fromCmp) {
    	var containers = [], matched = false;
    	Ext.Array.each(this.query("notebookrunnableeditorwrapper"), function(item) {
    		if (fromCmp && fromCmp===item) {matched=true;}
    		if (matched) {
    			containers.push(item);
    		}
    	}, this);
    	this._run(containers);
    },
    
    runAll: function() {
    	var containers = [];
    	Ext.Array.each(this.query("notebookrunnableeditorwrapper"), function(item) {
			containers.push(item);
    	}, this);
    	this._run(containers);
    },
    
    _run: function(containers, prevVars) {
    	if (containers.length>0) {
    		var container = containers.shift();
			var me = this;
    		container.run(true, prevVars).then(function(result) {
				// check for and remove older duplicates
				var newVars = container.getVariables();
				if (prevVars === undefined) {
					prevVars = [];
				}
				newVars.forEach(function(newVar) {
					for (var i = 0; i < prevVars.length; i++) {
						var prevVar = prevVars[i];
						if (newVar.name === prevVar.name) {
							// console.log('removing duplicate var:', prevVar.name);
							prevVars.splice(i, 1);
							break;
						}
					}
				});
				prevVars = prevVars.concat(newVars);
				
				Ext.defer(me._run, 100, me, [containers, prevVars]);
			}, function(error) {
				// console.log('nb error', error);
			});
    	}
	},

	notebookInitialized: function() {
		// run all data cells
		// var containers = [];
    	// Ext.Array.each(this.query("notebookdatawrapper"), function(item) {
		// 	containers.push(item);
    	// }, this);
    	// this._run(containers, []);
	},

	getNotebookVariables: function(upToCmp) {
		var variables = [];

		Ext.Array.each(this.query("notebookrunnableeditorwrapper"), function(item) {
			if (upToCmp && upToCmp===item) {return false;} // NB upToCmp exits earlier here than in runUntil

			if (item.getIsRun()) {
				var newVars = item.getVariables();
				newVars.forEach(function(newVar) {
					for (var i = 0; i < variables.length; i++) {
						var prevVar = variables[i];
						if (newVar.name === prevVar.name) {
							variables.splice(i, 1); // remove older duplicate var
							break;
						}
					}
				});

				variables = variables.concat(newVars);
			}
		});

		return variables;
	},

	getNotebookBlocks: function(upToCmp) {
		var blocks = [];

		Ext.Array.each(this.query("notebookrunnableeditorwrapper"), function(item) {
			if (upToCmp && upToCmp===item) {return false;} // NB upToCmp exits earlier here than in runUntil

			blocks.push(item.getInput());
		});

		return blocks;
	},


	
	addNew: function() {
		// TODO metadata defaults
		this.setMetadata(new Spyral.Metadata({
			title: "<h1>Spyral Notebook</h1>",
			language: "English"
		}));
		this.addText("<p>This is a Spyral Notebook, a dynamic document that combines writing, code and data in service of reading, analyzing and interpreting digital texts.</p><p>Spyral Notebooks are composed of text blocks (like this one) and code blocks (like the one below). You can <span class='marker'>click on the blocks to edit</span> them and add new blocks by clicking add icon that appears in the left column when hovering over a block.</p>");
		this.addCode('');
	},
    
    addText: function(block, order, cellId) {
    	return this._add(block, order, 'notebooktexteditorwrapper', cellId);
    },
 
    addCode: function(block, order, cellId, config) {
		config = config || {};
		config.docs = [this.spyralTernDocs, this.ecmaTernDocs, this.browserTernDocs];
    	return this._add(block, order, 'notebookcodeeditorwrapper', cellId, config);
    },

	addData: function(block, order, cellId, config) {
    	return this._add(block, order, 'notebookdatawrapper', cellId, config);
    },
    
    _add: function(block, order, xtype, cellId, config) {
    	if (Ext.isString(block)) {
    		block = {input: block}
    	}
    	var cells = this.getComponent("cells");
		order = (typeof order === 'undefined') ? cells.items.length : order;
		cellId = (typeof cellId === 'undefined') ? Spyral.Util.id() : cellId;
    	return cells.insert(order, Ext.apply(block, {
    		xtype: xtype,
    		order: order,
    		cellId: cellId
    	}, config))
    },

    
	notebookWrapperMoveUp: function(wrapper) {
		var cells = this.getComponent("cells");
		var i = cells.items.findIndex('id', wrapper.id);
		if (i==0) {
			Ext.Msg.show({
				title: this.localize('error'),
				msg: this.localize('cannotMoveHigher'),
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.WARNING
			});
		}
		else {
			cells.move(i, i-1);
			this.redoOrder();
		}
	},
	
	notebookWrapperMoveDown: function(wrapper) {
		var cells = this.getComponent("cells");
		var i = cells.items.findIndex('id', wrapper.id);
		if (i==cells.items.getCount()-1) {
			Ext.Msg.show({
				title: this.localize('error'),
				msg: this.localize('cannotMoveLower'),
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.WARNING
			});
		}
		else {
			cells.move(i, i+1);
			this.redoOrder();
		}
	},
	
	notebookWrapperRemove: function(wrapper) {
		var cells = this.getComponent("cells");
		cells.remove(wrapper);
		if (cells.items.length==0) {
			this.addText("(Click to edit).")
		}
		this.redoOrder();
	},
	
	notebookWrapperAdd: function(wrapper, e) {
		var cells = this.getComponent("cells");
		var i = cells.items.findIndex('id', wrapper.id);
		var runnable = wrapper.getXTypes(wrapper).indexOf('notebookrunnableeditorwrapper') !== -1;
		var cmp;
		if ((!runnable && !e.hasModifier()) || (runnable && e.hasModifier())) {
			cmp = this.addCode('',i+1);
		} else {
			cmp = this.addText('',i+1);
		}
		cmp.getTargetEl().scrollIntoView(this.getTargetEl(), null, true, true);
		this.redoOrder();
	},

    redoOrder: function() {
    	this.query("notebookwrappercounter").forEach(function(counter, i) {
    		counter.setOrder(i);
		})
		this.setIsEdited(true);
    },
    
    setIsEdited: function(val) {
    	// TODO: perhaps setup autosave
    	if (this.getHeader()) {
        	this.getHeader().down("#saveItTool").setDisabled(val === false);
        	if (!val) {
        		this.query("notebookcodeeditor").forEach(function(editor) {
        			editor.setIsChangeRegistered(false);
        		})
        		this.query("notebooktexteditor").forEach(function(editor) {
        			editor.setIsEditRegistered(false);
        		})
        	}
    	}
		this.callParent(arguments);
    },
    
    setNotebookId: function (id) {
    	if (id) {
    		// update URL if needed
    		if (location.pathname.indexOf("/spyral/"+id) === -1) {
    			let url = this.getBaseUrl()+"spyral/"+id+"/";
    			window.history.pushState({
					url: url
				}, '', url);
    		}
    	}
		this.callParent(arguments);
    },
		
	updateMetadata: function() {
		var metadata = this.getMetadata();
		document.title = metadata.title.replace(/<\/?\w+.*?>/g, '')+' - Spyral';

		this.getComponent("spyralHeader").update(this.getInnerHeaderHtml());
		this.getComponent("spyralFooter").update(this.getInnerFooterHtml());

		this.setIsEdited(true);
	},

	showMetadataEditor: function() {
		if (this.metadataWindow === undefined) {
			var me = this;
			
			this.metadataEditor = Ext.create('widget.metadataeditor', {
				anchor: '100%'
			});
			this.metadataWindow = Ext.create('Ext.window.Window', {
				title: this.localize('metadataEditor'),
				autoScroll: true,
				width: 600,
				closeAction: 'hide',
				layout: 'anchor',
				items: this.metadataEditor,
				buttons: [{
					text: this.localize('metadataCancel'),
					ui: 'default-toolbar',
					handler: function() {
						this.up('window').close();
					}
				},{
					text: this.localize('metadataReset'),
					ui: 'default-toolbar',
					handler: function() {
						me.metadataEditor.reset();
					}
				}, " ", {
					text: this.localize('metadataSave'),
					handler: function() {
						var form = me.metadataEditor.getForm();
						me.getMetadata().set(form.getValues());
						me.updateMetadata();
						this.up('window').close();
					}
				}]
			})
		}

		var metadata = this.getMetadata();
		if (metadata === undefined) {
			metadata = new Spyral.Metadata();
			this.setMetadata(metadata);
		}

		this.metadataEditor.loadMetadata(metadata);

		this.metadataWindow.show();
	}
});