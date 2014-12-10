/*global module:false*/
module.exports = function(grunt) {
    grunt.loadTasks('tasks');
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
                    '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                    ' * <%= pkg.homepage %>\n' +
                    ' * <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>' +
                    ' */\n'
        },
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                browser: true,
                globals: {
                    "console": true,
                    "jQuery": true,
                    "$": true
                }
            },
            files: [
                'src/bootstrap/*.js',
                'src/custom/**/*.js',
                'src/lib/**/*.js',
                'src/tracker/*.js',
            ]
        },
        qunit: {
            local: {
                options: {
                    urls: [
                        'http://127.0.0.1:8000/standard_engaged_time_local.html',
                    ]
                }
            },
        },
        concat: {
            engaged_time_tracker: {
                src:[
                    'src/tracker/lib/json2.js',
                    'src/tracker/lib/class.js',
                    'src/tracker/lib/jquery.custom-1.11.1.js',
                    'src/tracker/lib/jquery-visibility.js',
                    'src/tracker/engaged_time.js',
                ],
                dest: 'dist/engaged-time-debug.js'
            }
        },
        uglify: {
            engaged_time: {
                options: { banner: '<%= meta.banner %>' },
                src: ['<%= concat.engaged_time_tracker.dest %>'],
                dest: 'dist/engaged-time.js'
            }
        },
        watch: {
            files: ['src/**/*.*', 'tasks/*.*'],
            tasks: ['default', 'template']
        },
        template: {
             standard_engaged_time_local: {
                src: 'src/templates/engaged_time.test.underscore',
                dest: 'static/standard_engaged_time_local.html',
                variables: {
                    tag: 'standard',
                    env: 'local'
                }
             }
        },
        copy: {
            main: {
                files: [
                    {expand:true, cwd: 'dist/', src: ['*.js'], dest: 'static/js/engaged_time/', filter: 'isFile', flatten: true}
                ]
            },
            tests: {
                files: [
                    {expand:true, cwd: 'test/', src: ['*.js'], dest: 'static/js/', filter: 'isFile', flatten: true}
                ]
            }
        },
        connect: {
            'static-server': {
                options: {
                    port: 8000,
                    base: 'static'
                }
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Servers
    grunt.registerTask('run-local', ['jshint', 'concat' ,'uglify', 'copy',
                                     'template', 'mockserver', 'watch']);

    grunt.registerMultiTask('template', 'generates an html file from a specified template', function(){
        var data = this.data;
        grunt.file.write(data.dest, grunt.template.process(grunt.file.read(data.src), {data: data.variables}));
    });
};
