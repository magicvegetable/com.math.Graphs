# homedir = run_command('printenv', 'HOME').stdout().strip()
#
# app_init_conf = configuration_data()
# app_init_conf.set('FONT_DEST_DIR', homedir / '.fonts' / 'afacad')
# app_init_conf.set('FONT_SRC_DIR', get_option('prefix') / pkgdatadir / 'fonts')
# app_init_conf.set('FONT_CONFIG_SRC_FILE', get_option('prefix') / pkgdatadir / 'fonts.conf') # TODO 
# app_init_conf.set('FONT_CONFIG_DEST_FILE', homedir / '.config' / 'fontconfig' / 'fonts.conf') # TODO
# app_init_conf.set('APP_EXEC', get_option('prefix') / pkgdatadir / 'oop.my.graphs')
#
# app_init_h = configure_file(
#   input: 'app-init.h.in',
#   output: 'app-init.h',
#   configuration: app_init_conf,
#   install: true,
#   install_dir: get_option('bindir')
# )
#
# src = files(
#   'app-init.c',
#   'file-ops.c',
#   'file-ops.h',
# )
#
# deps = [
#   dependency('fontconfig'),
# ]
#
# executable('oop.my.graphs', src,
#   dependencies: deps,
#   sources: app_init_h,
#   install: true,
#   install_dir: get_option('bindir')
# )
#
# install_subdir('fonts', install_dir: pkgdatadir)

install_subdir('fonts', install_dir: get_option('datadir') / 'fonts' /'afacad')

# install_data('fonts.conf', install_dir: pkgdatadir)
