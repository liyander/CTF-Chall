
// Force simplified merge for guaranteed exploitability
function merge(target, source) {
    for (const key in source) {
        if (isObject(source[key])) {
            if (!target[key]) target[key] = {};
            merge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}
