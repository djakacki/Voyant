Ext.data.JsonP.wordtree({"guide":"<h1 id='wordtree-section-wordtree'>WordTree</h1>\n<div class='toc'>\n<p><strong>Contents</strong></p>\n<ol>\n<li><a href='#!/guide/wordtree-section-overview'>Overview</a></li>\n<li><a href='#!/guide/wordtree-section-options'>Options</a></li>\n<li><a href='#!/guide/wordtree-section-additional-information'>Additional Information</a></li>\n<li><a href='#!/guide/wordtree-section-see-also'>See Also</a></li>\n</ol>\n</div>\n\n<p>The Word Tree tool allows you to explore how keywords are used in different phrases in the corpus.</p>\n\n<p>Use it with a <a href=\"../?view=WordTree&corpus=austen\" target=\"_blank\">Jane Austen corpus</a> or with <a href=\"../?view=WordTree\" target=\"_blank\">your own corpus</a>.</p>\n\n<h2 id='wordtree-section-overview'>Overview</h2>\n\n<p>By default, the most common term is used as the first word tree root.</p>\n\n<p>You can click on terms to expand or collapse further branches, when they're available. Double-clicking on a term should trigger a phrase search in other Voyant panels (if applicable).</p>\n\n<iframe src=\"../tool/WordTree/?corpus=austen&subtitle=The+Works+of+Jane+Austen\" style=\"width: 90%; height: 400px;\"></iframe>\n\n\n<div style=\"width: 90%; text-align: center; margin-bottom: 1em;\">WordTree with the Works of Jane Austen. You can also <a href=\"../?view=WordTree\" target=\"_blank\">use WordTree with your own corpus</a>.</div>\n\n\n<p>At the moment the tree is constructed based on a limited number of concordances for the keyword (instances of the keyword with context on each side), the branches shown are not necessarily based on frequency.</p>\n\n<h2 id='wordtree-section-options'>Options</h2>\n\n<p>You can set the root term in the tree by typing a query into the search box and hitting enter (see <a href=\"#!/guide/search\">Term Searches</a> for more advanced searching capabilities).</p>\n\n<p>Other options:</p>\n\n<ul>\n<li><em>limit</em>: limit the number of concordance entries that are fetched (which determines in part how many repeating phrase forms can be found)</li>\n<li><em>branches</em>: limit the number of branches that are shown on each side of the keyword</li>\n<li><em>context</em>: limit the length of the context retrieved for branches</li>\n</ul>\n\n\n<p>Clicking on the <a href=\"#!/guide/options\">Options</a> icon allows you to define a set of stopwords to exclude – see the <a href=\"#!/guide/stopwords\">stopwords guide</a> for more information.</p>\n\n<h2 id='wordtree-section-additional-information'>Additional Information</h2>\n\n<p>Word Tree is an adaptation of Chris Culy's <a href=\"http://linguistics.chrisculy.net/lx/software/DoubleTreeJS/\">DoubleTreeJS</a>.</p>\n\n<h2 id='wordtree-section-see-also'>See Also</h2>\n\n<ul>\n<li><a href=\"#!/guide/start\">Getting Started</a></li>\n<li><a href=\"#!/guide/stopwords\">Stopwords</a></li>\n<li><a href=\"#!/guide/search\">Term Searches</a></li>\n<li><a href=\"#!/guide/skins-section-default-skin\">Default Skin</a></li>\n<li><a href=\"#!/guide/tools\">List of Tools</a></li>\n</ul>\n\n","title":"WordTree"});