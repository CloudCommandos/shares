var import_settings = {
    //if field is not optional, add in a 'length' test
    required_fields: [
        {
            columnName: 'Emp. No.',
            checks: [
                { type: 'is_integer' },
                { type: 'length', min_length: 1 }
            ]
        },
        {
            columnName: 'Name',
            checks: [
                { type: 'is_alphabet', allow_whitespace: true },
                { type: 'length', min_length: 1, max_length: 200 }
            ]
        },
        {
            columnName: 'HP',
            checks: [
                { type: 'is_numeric', allow_whitespace: false },
                { type: 'length', min_length: 8, max_length: 8 }
            ]
        },
        {
            columnName: 'Email',
            checks: [
                { type: 'is_email', domain_whitelist: [/*'example1.com','example2.com'*/], domain_blacklist: [/*'example1.com','example2.com'*/] },   //Whitelist and blacklist should NOT be used together
                //{ type: 'length', min_length: 0, max_length: 200 }
            ]
        },
    ]
}

module.exports = import_settings;