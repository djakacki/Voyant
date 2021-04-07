Ext.define("Voyant.util.ResponseError", {
	extend: "Voyant.util.DetailedError",
	config: {
		response: undefined
	},
	constructor: function(config) {
		this.setResponse(config.response);
		Ext.applyIf(config, {
			msg: config.response.statusText, // hopefully already set by creator
			error: ("responseText" in config.response) ? config.response.responseText.split(/(\r\n|\r|\n)/).shift() : "", // show first line of response
			details: ("responseText" in config.response) ? config.response.responseText : ""
		})
		this.callParent(arguments);
	}
	
})
