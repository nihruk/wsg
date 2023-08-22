'use strict'

const stdNunjucks = require('nunjucks')
const dsNunjucks = require('@nihruk/design-system/src/assets/js/nunjucks')
const path = require('path')

const nunjucksWwwFilePageUrlPathPrefixLength = path.resolve(__dirname, '..', 'www').length

class Environment extends dsNunjucks.Environment {
    constructor() {
        super(
            [
                new stdNunjucks.FileSystemLoader(path.resolve(__dirname, '..', 'nunjucks')),
                new stdNunjucks.FileSystemLoader(path.resolve(__dirname, '..', 'www')),
            ]
        )
    }

    renderPageFile(filename) {
        this.currentPageUrlPath = filename.slice(nunjucksWwwFilePageUrlPathPrefixLength)
            .split(path.sep)
            .join('/')
        return this.render(filename, {
            pageUrlPath: this.currentPageUrlPath,
        })
    }
}

module.exports = {
    Environment,
}
