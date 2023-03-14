const { PrismaClient} = require("@prisma/client");

const client  = new PrismaClient();

client.user.deleteMany({
    where: {
        phone: "+233553872291"
    }
}).then(console.log)
    .catch(console.log)
