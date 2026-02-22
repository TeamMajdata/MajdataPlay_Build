import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const ROOT_EXCLUDE_FILES = ["smallest_hashes.json", "hash.ts", "package.json", "pnpm-lock.yaml",
  "tsconfig.json", ".gitignore", ".github", ".git", "node_modules",
  "MaiCharts", "Skins", "README.md"];

// 计算文件的 SHA256 校验和
export function getFileChecksum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (chunk: any) => {
      hash.update(chunk);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex')); // 返回十六进制的哈希值
    });

    stream.on('error', (err: any) => {
      reject(err); // 错误处理
    });
  });
}

// 遍历文件夹并计算文件校验和
export async function calculateChecksums(directory: string): Promise<any[]> {
  const result: any[] = [];

  // 读取目录内容
  const files = await fs.promises.readdir(directory);

  for (const file of files) {
    if (directory === "." && ROOT_EXCLUDE_FILES.includes(file)) {
      continue;
    }

    const filePath = path.join(directory, file);
    const stat = await fs.promises.stat(filePath);

    if (stat.isDirectory()) {
      // 如果是文件夹，递归遍历
      const subdirChecksums = await calculateChecksums(filePath);
      result.push(...subdirChecksums); // 合并子目录的结果
    } else {
      // 如果是文件，计算校验和
      const checksum = await getFileChecksum(filePath);
      result.push({
        name: file,
        filePath: filePath,
        checksum: checksum,
      });
    }
  }

  return result;
}

// 保存文件校验和信息到 JSON 文件
export async function saveChecksumsToFile(directory: string, outputFile: string) {
  try {
    const checksums = await calculateChecksums(directory);
    await fs.promises.writeFile(outputFile, JSON.stringify(checksums, null, 2));
    console.log(`校验和已保存到 ${outputFile}`);
  } catch (error) {
    console.error('保存校验和时出错:', error);
  }
}


// 主函数 - 处理命令行参数
async function main() {

  const directory = ".";
  const outputFile = "smallest_hashes.json";

  // 检查目录是否存在
  try {
    const stat = await fs.promises.stat(directory);
    if (!stat.isDirectory()) {
      console.error(`错误: "${directory}" 不是一个有效的目录`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`错误: 无法访问目录 "${directory}"`);
    console.error(error);
    process.exit(1);
  }

  // 执行校验和计算
  await saveChecksumsToFile(directory, outputFile);
}


main();
