import { exec } from "child_process";
import fs from "fs";
import camelCase from "camelcase";

const root = "src/icons";
const iconsSrcDir = "node_modules/feather-icons/dist/icons";
const iconsDestDir = `${root}/svg`;
const indexFile = `${root}/index.ts`;

function stripExtension(fileName) {
  return fileName.substr(0, fileName.lastIndexOf("."));
}

function writeIcons() {
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(iconsDestDir, { recursive: true });

  for (const fileName of fs.readdirSync(iconsSrcDir)) {
    const iconName = stripExtension(fileName);
    const exportName = camelCase(iconName, { pascalCase: true });
    const svgContent = fs
      .readFileSync(`${iconsSrcDir}/${fileName}`)
      .toString()
      .match(/^<svg[^>]+?>(.+)<\/svg>$/)[1];

    fs.writeFileSync(
      `${iconsDestDir}/${iconName}.ts`,
      `export const ${exportName} = {
        name: "${iconName}" as const,
        svg: \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="feather feather-${iconName}">${svgContent}</svg>\`
      };`,
      "utf-8"
    );

    fs.appendFileSync(indexFile, `export { ${exportName} } from "./svg/${iconName}";\n`);
  }

  console.log("Icons successfully generated!");
}

function formatIcons() {
  exec(`npx prettier ${root} --write`, () => {
    console.log("Icons successfully formatted!");
  });
}

writeIcons();
formatIcons();
