const yaml = require('yaml')
const fs = require('fs')
const glob = require('glob')

// this file is kindof a duplicate of RulesProvider (which serves for the local watched webpack environment) in ecolab-climat
// if it grows more than 20 lines, it should be shared

const destinationPath = process.argv[2] ?? './public/co2.json'

glob('data/**/*.yaml', (err, files) => {
	const rules = files.reduce((memo, filename) => {
		const data = fs.readFileSync('./' + filename, 'utf8')
		const rules = yaml.parse(data)
		const splitName = filename.replace('data/', '').split('>.yaml')
		const prefixedRuleSet =
			splitName.length > 1
				? Object.fromEntries(
						Object.entries(rules).map(([k, v]) => [
							k === 'index' ? splitName[0] : splitName[0] + ' . ' + k,
							v,
						])
				  )
				: rules
		return { ...memo, ...prefixedRuleSet }
	}, {})
	fs.writeFile(destinationPath, JSON.stringify(rules), function (err) {
		if (err) return console.error(err)
		console.log('Les règles en JSON ont été écrites avec succès, bravo !')
	})
})
