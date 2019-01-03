class Parser {
    constructor(langs) {
        this.langsPrefer = langs

        this.linkEl = document.createElement('link')
        this.preEls = Array.from(document.querySelectorAll('pre'))
        // Cache each element innerHTML for reverting
        this.preElsCache = this.preEls.map((preEl) => preEl.innerHTML)
        // Pre-process <pre/> elements
        this.preprocess()

        this.themeName = 'atom-one-dark'

        this.init()
    }

    init() {
        // Get default theme and invoke corresponding CSS file
        this.getDefaultThemeName()

        // Get default langs preference
        this.getDefaultLangsPrefer()

        this.bindEvent()
    }

    // Create a <link/> and set CSS file path according to default theme
    initThemeCSS() {
        this.linkEl.setAttribute('rel', 'stylesheet')

        // Set default theme
        this.switchTheme(this.themeName)

        document.querySelector('head').appendChild(this.linkEl)
    }

    preprocess() {
        // Mixin relative <pre/> elements
        let miner = new Mixiner()
        miner.elsMixin(this.preEls)
    }

    getDefaultThemeName() {
        chrome.storage.sync.get(['themeName'], (result) => {
            this.themeName = result.themeName || 'atom-one-dark'
            console.log('Theme currently is ' + this.themeName);
            this.initThemeCSS()
        });
    }

    getDefaultLangsPrefer() {
        chrome.storage.sync.get(['langsPrefer'], (result) => {
            this.langsPrefer = result.langsPrefer ? result.langsPrefer : this.langsPrefer
            console.log('Langs preference is ' + this.langsPrefer.map((langPrefer) => langPrefer.value));

            // Register language preference to hljs
            hljs.configure({
                languages: this.langsPrefer.map((langPrefer) => langPrefer.value)
            })
        });
    }

    setThemeName(themeName) {
        this.themeName = themeName
        chrome.storage.sync.set({themeName: this.themeName}, () => {
            console.log('Theme is set to ' + this.themeName);
        });
    }

    setLangsPrefer(langsPrefer) {
        this.langsPrefer = langsPrefer
        chrome.storage.sync.set({langsPrefer: this.langsPrefer}, () => {
            console.log('Langs preference is set to ' + this.langsPrefer.map(((langPrefer) => langPrefer.value)));
            alert('Refresh this page to apply your language preference!')
        });
    }

    switchTheme(themeName) {
        let href = chrome.runtime.getURL(`lib/highlight/styles/${themeName}.css`)
        this.linkEl.setAttribute('href', href)
    }

    // Receive msg from popup.js
    bindEvent() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.eventName) {
                case 'parse':
                    console.log('Parsing this article');
                    this.parse()
                    break
                case 'revert':
                    this.revert()
                    break
                case 'switchThemeName':
                    this.switchTheme(request.themeName)
                    this.setThemeName(request.themeName)
                    break
                case 'switchLangsPrefer':
                    this.setLangsPrefer(request.langsPrefer)
                    break
            }
        });
    }

    // Revert to original styles
    revert() {
        for (let i = 0; i < this.preEls.length; i++) {
            this.preEls[i].removeAttribute('data-highlight')
            this.preEls[i].innerHTML = this.preElsCache[i]
        }
    }

    // Parse the whole page
    parse() {
        // test
        this.getHighlightBg((bgColor) => {
            this.preEls.map((preEl) => {
                // Each time get a new Code Block
                return new CodeBlock(preEl, this.langsPrefer, bgColor)
            })
        })
    }

    getHighlightBg(callback) {
        let div = document.createElement('div')
        div.className = 'hljs'
        div.id = 'test'
        document.body.appendChild(div)
        setTimeout(() => {
            console.log('1', getComputedStyle(div, null).getPropertyValue("background-color"));
            // Get theme highlight background color
            let bgColor = getComputedStyle(div, null).backgroundColor

            callback(bgColor)

            document.body.removeChild(div)
        }, 200)
    }
}
