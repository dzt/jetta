const settings = ((() => {

    const self = {
        settings: getSettings()
    };

    // syncs settings with UI elements - settings.sync()
    self.sync = () => {

        // sync notifications checkboxes
        $('[data-settings] input').each(function() {
            const sect = $(this).closest('[data-settings]').attr('data-settings');
            const name = $(this).attr('name');
            const type = $(this).attr('type');
            if (type == 'checkbox') {
                $(this).prop('checked', self.settings[sect][name]);
            } else if (type == 'text') {
                $(this).val(self.settings[sect][name]);
            }
        });

        // sync dropdowns
        $('[data-settings] select').each(function() {
            $(this).val(self.settings[$(this).closest('[data-settings]').attr('data-settings')][$(this).attr('name')]);
        });

        $('.filename').each(function() {
            $(this).html(self.settings.save.dir)
        });

    };

    //settings.save();
    self.save = () => {
        localStorage.settings = JSON.stringify(self.settings);
    };

    // function used for settings.settings()
    function getSettings() {
        if (localStorage.settings) {
            return JSON.parse(localStorage.settings);
        } else {
            console.log('adding new shit');
            return {
                save: {
                  dir: null
                }
            };
        }
    };

    return self;

}))();
