/**
 * The types of search modes supported by the assisted Search component.
 *
 * single: only a single value can be selected for the assisted search at any time.
 *
 * multiple: multiple values can be selected for the assisted search, but there are no facets.
 *
 * faceted: Multiple facets and values and be selected for the assisted search. Single values are also supported if the
 * entry supports it.
 *
 */
export type AssistedSearchType = 'single' | 'multiple' | 'faceted';
