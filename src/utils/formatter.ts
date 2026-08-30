
export function slug(s?: string) {
    if (!s) return '';
    let slug = s.toLowerCase().trim();
    slug = slug.replace(/[^a-z0-9\s-]/g, ' ').trim();
    slug = slug.replace(/[\s-/]+/g, '-');
    return slug;
}