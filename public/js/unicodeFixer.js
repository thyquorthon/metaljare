var conversionTable = [
    
    {key: '\\u00c3\\u00a1', value: 'á'},
    {key: '\\u00c3\\u00a9', value: 'é'},
    {key: '\\u00c3\\u00ad', value: 'í'},
    {key: '\\u00c3\\u00b3', value: 'ó'},
    {key: '\\u00c3\\u00ba', value: 'ú'},    
    {key: '\\u00c3\\u00b1', value: 'ñ'}
]

function fixUnicode(text) {
    var result = text;
    for (i=0; i< conversionTable.length; i++) {
        result = result.split(conversionTable[i].key).join(conversionTable[i].value);
    }
    return result;
}