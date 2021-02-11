Ext.define('Voyant.panel.NoTool', {
	extend: 'Ext.panel.Panel',
	mixins: ['Voyant.panel.Panel'],
	alias: 'widget.notool',
    statics: {
    	i18n: {
    	},
    	api: {
    		tool: undefined
    	}
    },
    config: {
    	html: undefined,
    	notYetImplemented: ["Centroid","DocumentInputAdd","DocumentTypeCollocateFrequenciesGrid","EntitiesBrowser","Equalizer","FeatureClusters","Flowerbed","KwicsTagger","Lava","Mandala","MicroSearch","NetVizApplet","PaperDrill","RezoViz","Sunburst","Termometer","Ticker","TokensViz","ToolBrowser","ToolBrowserLarge","VoyeurTagline","WordCloud","VoyeurTagline","WordCountFountain"]
    },
    constructor: function() {
    	Ext.apply(this, {
    		title: this.localize('title')
    	});
        this.callParent(arguments);
    	this.mixins['Voyant.panel.Panel'].constructor.apply(this, arguments);
    },
	listeners: {
		boxready: function(container, width, height) {
			var tool = this.getApiParam("notool");

			if (tool) {
				if (Ext.isArray(tool)) {tool=tool[0]}
				
				var msg = "";
				
				// check to see if this is a tool that's recognized but not implemented
				var oldTools = this.getNotYetImplemented();
				for (var i=0, len=oldTools.length; i<len; i++) {
					if (tool==oldTools[i]) {
						return Ext.Msg.show({
						    title: this.localize('error'),
						    message: new Ext.Template(this.localize('notImplemented')).applyTemplate([tool]),
						    buttons: Ext.Msg.YESNO,
							buttonText: {yes: this.localize("currentButton"), no: this.localize("oldButton")},
						    icon: Ext.Msg.ERROR,
						    scope: this,
						    fn: function(btn) {
						    	var url;
						    	if (btn=='yes') {
						    		url = this.getNewUrl();
						    	}
						    	else {
						    		url = "http://voyant-tools.org/tool/"+tool+"/";
							    	var query = Ext.Object.fromQueryString(document.location.search)
							    	delete query['tool']
							    	queryString = Ext.Object.toQueryString(query);
							    	if (queryString) {
								    	url += "?"+queryString
							    	}
						    	}
						    	window.location.replace(url);
						    }
						});
					}
				}

				Ext.Msg.show({
				    title: this.localize('error'),
				    message: new Ext.Template(this.localize('badToolSpecified')).applyTemplate([tool]),
				    buttons: Ext.Msg.OK,
				    icon: Ext.Msg.ERROR,
				    scope: this,
				    fn: function(btn) {
				    	window.location.replace(this.getNewUrl());
				    }
				});
				
			}
			
			// no tool specified, so just redirect
			else if (!this.config.html) {
				Ext.Msg.show({
				    title: this.localize('error'),
				    message: this.localize('noToolSpecified'),
				    buttons: Ext.Msg.OK,
				    icon: Ext.Msg.ERROR,
				    scope: this,
				    fn: function(btn) {
				    	window.location.replace(this.getNewUrl());
				    }
				});
			}
		}
	},
	getNewUrl: function() {
    	var query = Ext.Object.fromQueryString(document.location.search)
    	delete query['tool']
    	queryString = Ext.Object.toQueryString(query);
    	return this.getApplication().getBaseUrl()+(queryString ? "?"+queryString : "")
	}
});