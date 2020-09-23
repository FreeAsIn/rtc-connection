module.exports = {
    // Don't extend as mount can't be removed
    // instead copy the other settings
    // extends: `@snowpack/app-scripts-vue`,
    mount: {
        [`src/test`]: `/`,
        [`dist`]: `/module`
    },
    devOptions: {
        open: `none`,
        out: `dist/test`
    },
    install: [`socket.io-client`]
};
