Ext.data.JsonP.veliza({"guide":"<h1 id='veliza-section-veliza'>Veliza</h1>\n<div class='toc'>\n<p><strong>Contents</strong></p>\n<ol>\n<li><a href='#!/guide/veliza-section-overview'>Overview</a></li>\n<li><a href='#!/guide/veliza-section-editing-the-script'>Editing the Script</a></li>\n<li><a href='#!/guide/veliza-section-more-information'>More information</a></li>\n<li><a href='#!/guide/veliza-section-see-also'>See Also</a></li>\n</ol>\n</div>\n\n<p>Veliza is a (<i>very</i>) experimental tool for having a (limited) natural language exchange (in English) based on your corpus. It is inspired and enabled in large part by the famous <a href=\"https://en.wikipedia.org/wiki/ELIZA\" target=\"blank\">Eliza</a> program written by Joseph Weizenbaum in the 1960s.</p>\n\n<p>Use it with a <a href=\"../?view=Veliza&corpus=austen\" target=\"_blank\">Jane Austen corpus</a> or with <a href=\"../?view=Veliza\" target=\"_blank\">your own corpus</a>.</p>\n\n<h2 id='veliza-section-overview'>Overview</h2>\n\n<p>You can type in your own sentence and hit enter (or click the <em>send</em> button). This should generate a generic reply from Veliza that isn't influenced by your texts (that's the current behaviour, though we're considering ways of maybe having your texts influence the replies from Veliza). Keep in mind that the original Eliza was designed as a (parody of a) Rogerian psychotherapist, so the more you write content that sounds like it could be expressed to a psychologist, the more satisfying your results are likely to seem.</p>\n\n<p>You can click on the <em>from text</em> button to get Voyant to fetch a random sentence from your text as input, to which Veliza will generate a reply. You can hover over the fetched sentence to see from which text the sentence is extracted.</p>\n\n<p>Please note that Veliza is stubbornly monolingual, input sentences (including those from your texts) are expected to be in English (other languages may some day be supported).</p>\n\n<iframe src=\"../tool/Veliza/?corpus=austen&subtitle=The+Works+of+Jane+Austen\" style=\"width: 90%; height: 500px\"></iframe>\n\n\n<div style=\"width: 90%; text-align: center; margin-bottom: 1em;\">Veliza with the Works of Jane Austen. You can also <a href=\"../?view=Veliza\" target=\"_blank\">use Veliza with your own corpus</a>.</div>\n\n\n<h2 id='veliza-section-editing-the-script'>Editing the Script</h2>\n\n<p>You can view and edit the script that Veliza uses by clicking on the collapsed panel along the right side of the tool. The editor is resizable if you want to make it bigger relative to the chat window, just slide the divider between the two.</p>\n\n<p>There's a <a href=\"http://www.chayden.net/eliza/instructions.txt\">more detailed explanation of the syntax available</a>, but here are the most relevant parts:</p>\n\n<pre><code>pre: [source] [target] before analysis, substitute the single word in [source] with the word or words in [target]\npost: [source] [target] after analysis, substitute the single word in [source] with the word or words in [target]\nsynon: [word] [word] … during decomposition, treat any of the words as being the same as the first (when the first is written as @word)\nkey: [word] [weight] define a keyword to be matched during decomposition with an optional weight to define precedence of the keyword\n    decomp: [pattern] a pattern for matching that can include captured asterisks and synonyms as well as other words, which are then used for reassembly:\n        reasmb: [pattern] a pattern for reassembly when you can reference matched wildcards and synonyms with parenthetical numbers\n</code></pre>\n\n<p>For example here's a rule that says match a sentence with the word \"dreamed\" and if the phrase has \"I dreamed\" then reply \"Really, \" followed by what's captured after I dreamed, in other words the second (2) asterisk.</p>\n\n<pre><code>key: dreamed 4\n    decomp: * i dreamed *\n        reasmb: Really, (2) ?\n</code></pre>\n\n<h2 id='veliza-section-more-information'>More information</h2>\n\n<p>The original Eliza program was written by Joseph Weizenbaum and described in an article entitled <a href=\"http://dl.acm.org/citation.cfm?doid=365153.365168\">\"ELIZA—a computer program for the study of natural language communication between man and machine\"</a> (<em>Communications of the ACM</em>, 1966). It's important to emphasize that Weizenbaum intended to demonstrate the superficiality of automated communication even though many people were amazed by exchanges with Eliza and found it to be a promising early example of artificial intelligence (some five decades before Siri and its ilk).</p>\n\n<p>Weizenbaum's description of Eliza has been implemented countless times in different languages. The version used here, by Veliza, is a lightly adapted variant of <a href=\"http://www.chayden.net/eliza/Eliza.html\">Chad Hayden's Java</a> version which he characterizes as \"a complete and faithful implementation of the program described by Weizenbaum\". We chose to base Veliza on Hayden's version mostly because of the ease of finding and integrating it to Voyant. The iMessage-like styling of the discussion is adapted from code by <a href=\"https://codepen.io/adobewordpress/pen/wGGMaV\">adobewordpress</a>.</p>\n\n<p>Sentences generated by the user are processed directly by Veliza. When the user hits \"check text\" the following process happens:</p>\n\n<ul>\n<li>one of the documents from the corpus is randomly selected</li>\n<li>if that document hasn't yet been parsed for sentences, it's parsed\n\n<ul>\n<li>all whitespace (spaces, tabs, new lines, etc.) are converted to a single space</li>\n<li>any letter leading to any end of sentence punctuation mark (.?!) followed by a space or end of document is identified</li>\n<li>If the sequence seems to have at leased two words it's added to a list of sentences</li>\n</ul>\n</li>\n<li>a random sentence is selected from the document and a response from Veliza is generated</li>\n<li>if the reply seems to be very generic (i.e. from a finite list of sentences that indicate that Veliza was not able to find any useful keywords) the previous step is repeated until about one second has elapsed (at which point the genetic reply is kept)</li>\n</ul>\n\n\n<p>Veliza was born from a conversation Stéfan and Geoffrey (we) were having (as part of a larger book project) on significant moments, algorithms and people in the history of digital humanities (and computing in general). In particular we were talking about early examples of text generation and what's sometimes called robotic poetics (see <a href=\"http://digitalhumanities.org:3030/companion/view?docId=blackwell/9781405103213/9781405103213.xml&amp;doc.view=print&amp;chunk.id=ss1-4-11&amp;toc.depth=1&amp;toc.id=0\">Winder</a> 2004). We were musing about what it might be like to converse naturally (in English) with your texts, or even having your texts converse with something like Eliza. After a few hours work we had a working prototype (thanks in large part to an existing open-source version of Eliza and the flexible and extensible architecture of Voyant).</p>\n\n<p>Veliza is a playful tool and an ongoing experiment.</p>\n\n<h2 id='veliza-section-see-also'>See Also</h2>\n\n<ul>\n<li><a href=\"#!/guide/start\">Getting Started</a></li>\n<li><a href=\"#!/guide/tools\">List of Tools</a></li>\n</ul>\n\n","title":"Veliza"});