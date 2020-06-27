import * as path from "path";
import * as ts from "typescript";
import * as sass from "node-sass";


export class Compiler {


    public static ts(input: string, file: string, tsConfigFileName: string = 'tsconfig.json') {
        let projectDirectory = process.cwd();
		let compilerOptions: ts.CompilerOptions;
        tsConfigFileName = path.resolve(process.cwd(), tsConfigFileName);
        projectDirectory = path.dirname(tsConfigFileName);

        let tsConfig = ts.readConfigFile(tsConfigFileName, ts.sys.readFile);

        let parsed: ts.ParsedCommandLine =
					ts.parseJsonConfigFileContent(
						tsConfig.config || {},
						{
                            useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
                            readDirectory: () => [],
                            fileExists: ts.sys.fileExists,
                            readFile: ts.sys.readFile
                        },
						path.resolve(projectDirectory),
						undefined,
                        tsConfigFileName);
        compilerOptions = parsed.options;

        const output: ts.TranspileOutput = ts.transpileModule(input, {
			compilerOptions,
			fileName: file,
			reportDiagnostics: true,
			transformers: undefined,
		});
		return output.outputText.replace(/\/\/#\ssourceMappingURL[\s\S]+$/, '');
    }

    public static sass(input: string, file: string, lang = 'scss'): string {
        const output = sass.renderSync({
            data: input,
            file,
            //includePaths: [],
            indentedSyntax: lang === 'sass'
        });
        return output.css.toString();
    }

}