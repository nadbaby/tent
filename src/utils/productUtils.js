export const getFamilyKey = (p) => {
    if (!p) return '';
    if (p.primaryKey && p.primaryKey.trim()) {
        return `pk_${p.primaryKey.trim().toLowerCase()}`;
    }

    const pName = p.name ? p.name.toLowerCase() : '';
    const pSku = p.sku ? p.sku.toLowerCase() : '';
    const searchStr = `${pName} ${pSku}`.replace(/[-\s_]/g, '');

    if (searchStr.includes('a152') || searchStr.includes('a154') || searchStr.includes('a157')) {
        return `a15x_group_${(p.category || '').toLowerCase()}`;
    }
    if (searchStr.includes('a202')) {
        return `a202_group_${(p.category || '').toLowerCase()}`;
    }

    return `prod_${p.id || p.sku || p.slug || p.name}`;
};
