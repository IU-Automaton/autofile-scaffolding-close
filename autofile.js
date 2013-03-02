'use strict';

var fs     = require('fs'),
    glob   = require('glob'),
    async  = require('async')
;

module.exports = function (task) {
    task
    .id('scaffolding-close')
    .name('Scaffolding: close.')
    .description('Close {{placeholders}} in files.')
    .author('Indigo United')

    .option('files', 'Which files to process. Accepts a filename and array of filenames. Also note that the filenames can be minimatch patterns.')
    .option('placeholders', 'Which placeholders to close. Accepts a string, or an array of strings.')
    .option('trim', 'Trim leading or trailing spaces', 'true')
    .option('glob', 'The options to pass to glob (check https://npmjs.org/package/glob for details).', null)

    .do(function (opt, ctx, next) {
        opt.glob = opt.glob || {};
        var files = Array.isArray(opt.files) ? opt.files : [opt.files];
        var placeholders = Array.isArray(opt.placeholders) ? opt.placeholders : [opt.placeholders];
        var data = {};

        opt.glob.mark = true;

        placeholders.forEach(function (placeholder) {
            data[placeholder] = '';
        });

        // data is done at this time
        // For each item in the files array, perform a glob
        async.forEach(files, function (file, next) {
            glob(file, opt.glob, function (err, matches) {
                if (err) {
                    return next(err);
                }

                var files = matches.filter(function (match) {
                    return !/[\/\\]$/.test(match);
                });

                // For each file in the glob result,
                // perform the interpolation
                async.forEach(files, function (file, next) {
                    ctx.log.debugln('Reading file: ' + file);
                    fs.readFile(file, function (err, contents) {
                        if (err) {
                            return next(err);
                        }

                        contents = ctx.string.interpolate(contents.toString(), data, { trim: opt.trim });
                        ctx.log.debugln('Writing file: ' + file);
                        fs.writeFile(file, contents, next);
                    });
                }, next);
            });
        }, next);
    });
};