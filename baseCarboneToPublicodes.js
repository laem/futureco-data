const csv = require('csv-parser')
const fs = require('fs')
const results = []
const yaml = require('yaml')

const oldFile = fs.readFileSync('co2.yaml.2019', { encoding: 'utf8' })
// ./alimentation-base-carbone.yaml
let rules = yaml.parse(oldFile)

fs.createReadStream('base_carbone_v19.0.csv')
	.setEncoding('latin1')
	// get this file here : https://github.com/laem/futureco-data/issues/50
	.pipe(csv({ separator: ';' }))
	.on('data', (data) => {
		let {
			'Code de la catégorie': categorie,
			'Unité français': unité,
			'Type Ligne': type,
			'Total poste non décomposé': co2e,
			'Nom base français': nom,
			'Nom attribut français': attribut,
		} = data

		categorie.includes(
			'Achats de biens > Produits agro-alimentaires, plats préparés et boissons > Plats préparés > '
		) &&
			unité === 'kgCO2e/portion' &&
			type === 'Elément' &&
			results.push({
				dottedName:
					'alimentation' +
					' . ' +
					nom +
					(attribut ? ' - ' + attribut.replace(', ', ' - ') : ''),
				description: data['Commentaire français'],
				formule: +co2e.replace(',', '.'),
				unité: 'kgCO₂e',
				références: [
					'http://www.bilans-ges.ademe.fr/fr/actualite/actualite/detail/id/23',
				],
			})
	})
	.on('end', () => {
		// We'll now update, not replace, the current publicodes file

		let updatedRules = results.map((newRule) => {
			const oldRule =
				rules[newRule.dottedName.replace('alimentation', 'nourriture')] || {}

			return {
				...oldRule,
				...newRule,
				dottedName: newRule.dottedName.replaceAll(' - ', '-'),
				exposé: 'oui',
				description: oldRule.description || newRule.description,
				...(oldRule.titre ? { titre: oldRule.titre } : {}),
			}
		})
		fs.writeFile(
			'./data/alimentation-base-carbone.yaml',
			yaml.stringify(
				Object.fromEntries(
					updatedRules.map((el) => {
						const { dottedName, ...value } = el
						return [dottedName, value]
					})
				)
			),
			function (err) {
				if (err) {
					return console.log(err)
				}

				console.log('The file was saved!')
			}
		)
	})
