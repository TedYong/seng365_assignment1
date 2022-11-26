import bcrypt from 'bcrypt';

async function passwordhash (passwords: string) {
    const SALT_ROUNDS = 10;
    return bcrypt.hashSync(passwords, SALT_ROUNDS);
}

async function compare (first: string, second: string) {
   return bcrypt.compareSync(first, second);
}
export {passwordhash, compare}