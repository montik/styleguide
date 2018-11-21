const 	jsdom = require('jsdom'),
  _ = require('lodash'),
	{ JSDOM } = jsdom;

function replaceInsertTags(section, index) {
	// Object -> Int -> String
	function getMarkup(section, modifier, parameters) {
		if (section.modifiers && section.modifiers.length < modifier) {
			console.log("section-references.js: Section " + section.reference + "-" + modifier + " referenced, which is not existent.");
		}

		if (section.pugFunction) {
			const modifierCls = (section.modifiers && section.modifiers[modifier]) ?
				section.modifiers[modifier].className : "";
			const options = Object.assign(section.pugOptions, parameters, {modifier: modifierCls});

			return section.pugFunction(options);
		} else if (section.modifiers && section.modifiers.length > modifier ) {
			return section.modifiers[modifier].markup;
		} else {
			return section.markup;
		}
	}

	// String -> String
	function replaceInsertTagsI(markup) {
		const dom = new JSDOM(markup);
		dom.window.document.body.querySelectorAll('sg-insert').forEach(insertTag =>{
			const modifier = parseInt(insertTag.getAttribute('modifier') || 1) - 1;
			const pugParameters = JSON.parse(insertTag.getAttribute('parameters'));
			const referencedSection = index[insertTag.textContent.trim()];
			const extraClass = insertTag.classList.toString();

			if (!referencedSection || !referencedSection.markup ) {
				console.error("section-references.js: the section " +
							  insertTag.textContent + " has no markup");
				return '';
			}

			var markupToInsert = getMarkup(referencedSection, modifier, pugParameters);

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

function replaceReferences(sections, index) {
	sections.forEach(_ => replaceInsertTags(_, index));

	return sections;
}

module.exports.replace = replaceReferences;
