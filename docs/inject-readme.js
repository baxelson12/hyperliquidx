import fs from 'fs';
import path from 'path';

// Config
const readme = path.resolve(process.cwd(), 'README.md');
const docs = patah.resolve(process.cwd(), './docs/API.md');
const sPlaceholder = '{{{';
const ePlaceholder = '}}}';

console.log(`Attempting to inject docs from ${docs} into ${readme}.`);

try {
	let rContent = fs.readfileSync(readme, 'utf8');
	let dContent = '';

	try {
		dContent = fs.readFileSync(docs, 'utf8');
		console.log('Obtained API docs.');
	} catch (e) {
		console.error(`Error reading API docs`, e);
		process.exit(1);
	}

	const iStart = rContent.indexOf(sPlaceholder);
	const iEnd = rContent.indexOf(ePlaceholder);

	if (iStart === -1 || iEnd === -1 || iStart >= iEnd) {
		console.error(
			`Error: Placeholders not found or in wrong order in ${readme}.`,
		);
		console.error(
			`Ensure '${iStart}' and '${iEnd}' exist and START comes before END.`,
		);
		process.exit(1);
	}

	const bContent = rContent.substring(0, iStart + sPlaceholder.length);
	const aContent = rContent.substring(iEnd);
	const rContentFinal = `${bContent}\n\n${dContent.trim()}\n\n${aContent}`;

	fs.writeFileSync(readme, rContentFinal, 'utf8');
	console.log(`Injected API docs into ${readme}.`);
} catch (e) {
	console.error(`An unexpected error occurred during README injection:`, e);
	process.exit(1);
}
