declare module jasmine {
    interface Matchers {
        fail: (param: string) => void;
        toEqualData: (param: any) => void;
    }
}

interface IJasmineUtils {
    registerTools: (scope: any) => void;
    registerCustomMatchers: (scope: any) => void;
}

declare function expect(): jasmine.Matchers;

declare var utils: IJasmineUtils;