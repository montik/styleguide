const 	jsdom = require('jsdom'),
  _ = require('lodash'),
	{ JSDOM } = jsdom;

var referenceDictionary = require('./reference-dictionary'),
    buildReferenceDictionary = referenceDictionary.build;

function replaceInsertTags(section, index) {
	// Object -> Int -> String
	function getMarkup(section, modifier) {
		if (section.modifiers && section.modifiers.length < modifier) {
			console.log("section-references.js: Section " + section.reference + "-" + modifier + " referenced, which is not existent.");
		}

		if (section.pugFunction && section.modifiers && section.modifiers.length > 0) {
			const options = Object.assign({modifier: section.modifiers[modifier].className},
                                    section.pugOptions)
			return section.pugFunction(options);
		} else if (section.modifiers && section.modifiers.length > modifier ) {
			return section.modifiers[modifier].markup;
		} else {
			return section.pugFunction ? section.pugFunction(section.pugOptions)
					: section.markup;
		}
	}

	// String -> String
	function replaceInsertTagsI(markup) {
		const dom = new JSDOM(markup);
		dom.window.document.body.querySelectorAll('sg-insert').forEach(insertTag =>{
			const modifier = parseInt(insertTag.getAttribute('modifier') || 1) - 1;
			const referencedSection = index[insertTag.textContent.trim()];
			const extraClass = insertTag.classList.toString();

	    if (!referencedSection || !referencedSection.markup ) {
				console.error("section-references.js: the section " + insertTag.textContent + " has no markup");
				return '';
			}

			var markupToInsert = getMarkup(referencedSection, modifier);

			if (extraClass != "") {
				const domToInsert = new JSDOM(markupToInsert);
				const root = domToInsert.window.document.body.firstChild;
				root.classList = root.classList + " " + extraClass;
				markupToInsert = root.outerHTML;
			}

			insertTag.insertAdjacentHTML('beforebegin', replaceInsertTagsI(markupToInsert));
			insertTag.parentNode.removeChild(insertTag);
		});

		return dom.window.document.body.innerHTML;
	}

	if (section.markup) {
		section.markup = replaceInsertTagsI(section.markup);
	}
  
  if (section.modifiers) {
    section.modifiers.forEach(_ => _.markup = replaceInsertTagsI(_.markup));
  }

	return section;
}

// String -> ()
function addWrapper(section, parentWrapper) {
	if (parentWrapper) {
		const trimmedParentWrapper = parentWrapper.trim();
		if (section.sgWrapper) {
			const trimmedSectionWrapper = section.sgWrapper.trim();
			section.sgWrapper = trimmedParentWrapper.replace(/<sg\-wrapper\-content\/>/, trimmedSectionWrapper);
		} else {
			section.sgWrapper = trimmedParentWrapper;
		}
	}

	section.sections && section.sections.forEach(_ => addWrapper(_, section.sgWrapper));
}

function replaceReferences(sections) {
  const index = buildReferenceDictionary(sections);
	_.forIn(index, (section => {
			if(section.parentReference == undefined && section.sections != undefined) {
				section.sections.forEach(_ => addWrapper(_, section.sgWrapper))
			}
		})
	);
  sections.forEach(_ => replaceInsertTags(_, index));
	return sections;
}

module.exports.replace = replaceReferences;
