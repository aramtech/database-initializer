import Logger from "$/server/utils/cli/logger.js";
import { load_env } from "$/server/utils/cli/utils/load_env/index.js";
import { create_path_resolver } from "$/server/utils/common/index.ts";
import { execSync } from "child_process";
import path from "path";
import url from "url";
const resolve = create_path_resolver(import.meta.url);

const current_path = path.dirname(url.fileURLToPath(import.meta.url));

const env = load_env();

/**
 * 
sudo mysql -uroot < $sp/initialize.sql
sudo timedatectl set-timezone Africa/Tripoli

 */
const found_admin = execSync(`sudo mysql -uroot -e 'select JSON_ARRAYAGG(JSON_OBJECT("username",User)) as \`\` from mysql.user where User = "admin"'`, {
    encoding: "utf-8",
})
    ?.trim()
    .toLowerCase();

Logger.text("Found Admin", found_admin);

const initialize_sql_file_full_path = resolve("./initialize.sql");

const admin = JSON.parse(found_admin)?.[0];
if (!admin) {
    execSync(`sudo mysql -uroot < "${initialize_sql_file_full_path}"`, {
        encoding: "utf-8",
        stdio: "inherit",
        cwd: current_path,
    });
    Logger.success("> Created 'admin' user mysql server");
} else {
    Logger.warning("> 'admin' user already created and exists on mysql server");
}

console.log("");

const default_timezone = env.datetime.timezone.default_name || "Africa/Tripoli";
const current_timezone = execSync("sudo timedatectl show", {
    encoding: "utf-8",
})
    ?.trim()
    .split("\n")?.[0]
    ?.split("=")?.[1];
if (!current_timezone || current_timezone != default_timezone) {
    execSync(`sudo timedatectl set-timezone ${default_timezone}`, {
        encoding: "utf-8",
        stdio: "inherit",
    });
    Logger.success(`> changed time zone to ${default_timezone}`);
} else {
    Logger.warning(`> timezone is already ${current_timezone}`);
}
