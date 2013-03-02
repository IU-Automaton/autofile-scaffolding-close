'use strict';

var fs        = require('fs');
var expect    = require('expect.js');
var rimraf    = require('rimraf');
var close     = require('../autofile');
var automaton = require('automaton').create();

describe('scaffolding-close', function () {
    function clean(done) {
        rimraf(__dirname + '/tmp', done);
    }

    beforeEach(function (done) {
        clean(function (err) {
            if (err) {
                throw err;
            }

            fs.mkdirSync(__dirname + '/tmp');

            // Copy assets to the tmp
            var file1 = fs.readFileSync(__dirname + '/assets/file1.json');
            fs.writeFileSync(__dirname + '/tmp/file1.json', file1);
            fs.writeFileSync(__dirname + '/tmp/file1_copy.json', file1);

            var file2 = fs.readFileSync(__dirname + '/assets/file2');
            fs.writeFileSync(__dirname + '/tmp/file2', file2);

            done();
        });
    });
    after(clean);

    it('should close placeholder', function (done) {
        automaton.run({
            setup: function (opts, ctx, next) {
                opts.__dirname = __dirname;
                next();
            },
            tasks: [
                {
                    task: close,
                    options: {
                        files: ['{{__dirname}}/tmp/file1.json', '{{__dirname}}/tmp/file1_copy.json'],
                        placeholders: 'placeholder'
                    }
                }
            ]
        }, null, function (err) {
            if (err) {
                throw err;
            }

            var contents = JSON.parse(fs.readFileSync(__dirname + '/tmp/file1.json'));
            expect(contents.name).to.equal('{{name}}');
            expect(contents.email).to.equal('{{email}}');
            expect(contents.some_field).to.equal('This has an , you see?');
            expect(contents.other_field).to.equal('Here\'s the  again just in case..');

            contents = JSON.parse(fs.readFileSync(__dirname + '/tmp/file1_copy.json'));
            expect(contents.name).to.equal('{{name}}');
            expect(contents.email).to.equal('{{email}}');
            expect(contents.some_field).to.equal('This has an , you see?');
            expect(contents.other_field).to.equal('Here\'s the  again just in case..');

            done();
        });
    });

    it('should close placeholder, trimming empty lines before or after it', function (done) {
        automaton.run({
            setup: function (opts, ctx, next) {
                opts.__dirname = __dirname;
                next();
            },
            tasks: [
                {
                    task: close,
                    options: {
                        files: '{{__dirname}}/tmp/file2',
                        placeholders: ['name', 'body', 'signature']
                    }
                }
            ]
        }, null, function (err) {
            if (err) {
                throw err;
            }

            var contents = fs.readFileSync(__dirname + '/tmp/file2').toString();
            expect(contents).to.equal('Hi there, ');

            done();
        });
    });

    it('should close placeholder, not trimming empty lines if trim option is false', function (done) {
        automaton.run({
            setup: function (opts, ctx, next) {
                opts.__dirname = __dirname;
                next();
            },
            tasks: [
                {
                    task: close,
                    options: {
                        files: '{{__dirname}}/tmp/file2',
                        placeholders: ['name', 'body', 'signature'],
                        trim: false
                    }
                }
            ]
        }, null, function (err) {
            if (err) {
                throw err;
            }

            var contents = fs.readFileSync(__dirname + '/tmp/file2').toString();
            expect(contents).to.equal('Hi there, \n\n\n\n');

            done();
        });
    });

    it('should accept minimatch patterns', function (done) {
        automaton.run({
            setup: function (opts, ctx, next) {
                opts.__dirname = __dirname;
                next();
            },
            tasks: [
                {
                    task: close,
                    options: {
                        files: ['{{__dirname}}/tmp/file1*.json'],
                        placeholders: ['placeholder']
                    }
                }
            ]
        }, null, function (err) {
            if (err) {
                throw err;
            }

            var contents = JSON.parse(fs.readFileSync(__dirname + '/tmp/file1.json'));
            expect(contents.name).to.equal('{{name}}');
            expect(contents.email).to.equal('{{email}}');
            expect(contents.some_field).to.equal('This has an , you see?');
            expect(contents.other_field).to.equal('Here\'s the  again just in case..');

            contents = JSON.parse(fs.readFileSync(__dirname + '/tmp/file1_copy.json'));
            expect(contents.name).to.equal('{{name}}');
            expect(contents.email).to.equal('{{email}}');
            expect(contents.some_field).to.equal('This has an , you see?');
            expect(contents.other_field).to.equal('Here\'s the  again just in case..');

            done();
        });
    });

    it('should pass over the glob options', function (done) {
        // Rename to .file1.json and tell glob to match files starting with dot
        fs.renameSync(__dirname + '/tmp/file1.json', __dirname + '/tmp/.file1.json');

        automaton.run({
            setup: function (opts, ctx, next) {
                opts.__dirname = __dirname;
                next();
            },
            tasks: [
                {
                    task: close,
                    options: {
                        files: ['{{__dirname}}/tmp/*file1.json'],
                        placeholders: ['placeholder'],
                        glob: {
                            dot: true
                        }
                    }
                }
            ]
        }, null, function (err) {
            if (err) {
                throw err;
            }

            var contents = JSON.parse(fs.readFileSync(__dirname + '/tmp/.file1.json'));
            expect(contents.name).to.equal('{{name}}');
            expect(contents.email).to.equal('{{email}}');
            expect(contents.some_field).to.equal('This has an , you see?');
            expect(contents.other_field).to.equal('Here\'s the  again just in case..');

            done();
        });
    });

    it('should skip folders', function (next) {
        // Create dir inside tmp
        fs.mkdirSync(__dirname + '/tmp/some_dir');

        // Scaffolding, matching the newly created it
        automaton.run({
            setup: function (opts, ctx, next) {
                opts.__dirname = __dirname;
                next();
            },
            tasks: [
                {
                    task: close,
                    options: {
                        files: ['{{__dirname}}/tmp/**/*'],
                        placeholders: 'placeholder'
                    }
                }
            ]
        }, null, function (err) {
            if (err) {
                throw err;
            }

            next();
        });
    });
});