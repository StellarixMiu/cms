function slugify(text: string): string {
	return text
		.toString()
		.toLowerCase()
		.trim()
		.normalize('NFD') // separate accent marks from letters
		.replace(/[\u0300-\u036f]/g, '') // remove accent marks
		.replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric except spaces and hyphens
		.replace(/[\s_-]+/g, '-') // convert spaces, underscores, multiple hyphens to single hyphen
		.replace(/^-+|-+$/g, ''); // strip leading/trailing hyphens
}

export { slugify };
