#include "app-init.h"
#include "file-ops.h"
#include <fontconfig/fontconfig.h>

static const FcChar8* VALID_FONT_DIRS[] = {
    // (const FcChar8*)"~/.var/app/oop.my.graphs/data/fonts",
    (const FcChar8*)"/usr/share/fonts",
    (const FcChar8*)"/usr/share/runtime/share/fonts",
    // (const FcChar8*)"/run/host/user-share/fonts",
    // (const FcChar8*)"/run/host/share/fonts",
    // (const FcChar8*)"~/.fonts",
    (const FcChar8*)"/app/share/fonts",
    // (const FcChar8*)"/run/host/local-fonts",
    (const FcChar8*)"/run/host/fonts",
    (const FcChar8*)"/run/host/user-fonts"
};

FcStrSet *get_valid_font_dirs() {
    FcStrSet *set = FcStrSetCreate();
    size_t len = ARRAY_LENGTH(VALID_FONT_DIRS);
    for (size_t i = 0; i < len; i++)
        FcStrSetAddFilename(set, VALID_FONT_DIRS[i]);
    return set;
}

int load_fonts(FcConfig *config) {
    FcStrSet *valid_dirs = get_valid_font_dirs();
    FcStrList *dirs = FcConfigGetFontDirs(config);
    for (FcChar8 *dir = FcStrListNext(dirs);
        dir != NULL;
        dir = FcStrListNext(dirs)
    ) {
        if (FcStrSetMember(valid_dirs, dir)) {
            char dest[strlen((const char*)dir) + strlen("/afacad") + 1];
            sprintf(dest, "%s/afacad", dir);
            int status = copy_dir(FONT_SRC_DIR, dest);
            if (status == 0) {
                printf("load dir: %s\n", dest);
                // load font to font config
                FcDirCacheRescan((FcChar8*)dest, config);
                return 0;
            }
        }
    }

    FcStrListDone(dirs);
    FcStrSetDestroy(valid_dirs);
    return -1;
}

int fonts_exist(FcConfig *config) {
    int result = 0;

    FcPattern *pattern = FcPatternCreate();
    FcPatternAddString(pattern, FC_FAMILY, (const FcChar8*)"Afacad");

    FcObjectSet *os = FcObjectSetBuild(FC_FULLNAME, (char *)NULL);
    FcFontSet *set = FcFontList(config, pattern, os);
    result = set->nfont == AMOUNT_OF_FONTS;

    FcObjectSetDestroy(os);
    FcPatternDestroy(pattern);
    return result;
}

int reload_cache(FcConfig *config) {
    FcStrList *dirs = FcConfigGetCacheDirs(config);
    for (FcChar8 *dir = FcStrListNext(dirs);
        dir != NULL;
        dir = FcStrListNext(dirs)
    ) FcDirCacheClean(dir, 1);
    FcStrListDone(dirs);

    dirs = FcConfigGetFontDirs(config);
    for (FcChar8 *dir = FcStrListNext(dirs);
        dir != NULL;
        dir = FcStrListNext(dirs)
    ) FcDirCacheRescan(dir, config);
    FcStrListDone(dirs);

    return 0;
}

int main() {
    int ret_code = -1;
    // FcConfig *config = FcConfigGetCurrent();
    // if (!fonts_exist(config)) {
    //     printf("jojo");
    //     int status = load_fonts(config);
    //     if (status == -1) {
    //         fprintf(stderr, "Afacad font wasn't loaded\n");
    //         return -1;
    //     }
    // }
    //
    // if (!fonts_exist(config)) {
    //     fprintf(stderr, "font isn't detected!\n");
    //     return -1;
    // }

    ret_code = system(APP_EXEC);

    return ret_code;
}
