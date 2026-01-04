/*
    Taxi bot for Fortnite: Save The World 
*/
const { readFile, writeFile } = require('fs').promises;
const { Client } = require('fnbr');

const LEAVETIME = 60 * 1000
let isBusy = false

async function setAvailability(client, status) {
    switch (status) {
        case "free":
            isBusy = false
            await client.setStatus('💚 FREE 💚')
            break;
        case "busy":
            isBusy = true
            await client.setStatus('🔴 BUSY 🔴')
            break;
    }
};

async function setPrivacy(client) {
    await client.party.setPrivacy({
        acceptingMembers: false,
        invitePermission: "Leader",
        inviteRestriction: "LeaderOnly",
        onlyLeaderFriendsCanJoin: false,
        partyType: "Private",
        presencePermission: "Leader"
    }, true)
}

(async () => {

    let auth;
    try {
        auth = { deviceAuth: JSON.parse(await readFile('./deviceAuth.json')) };
    } catch (e) {
        auth = { authorizationCode: async () => Client.consoleQuestion('Please enter an authorization code: ') };
    }

    const client = new Client({ auth });


    let timeout;

    client.on('deviceauth:created', async (deviceAuth) => {
        await writeFile('./deviceAuth.json', JSON.stringify(deviceAuth, null, 2), 'utf8');
    });

    client.once('ready', async () => {
        console.log(`Logged in as ${client.user.self.displayName}`);
        await setPrivacy(client)

        await client.party.me.setOutfit('CID_A_040_Athena_Commando_F_Temple');
        
        await client.party.me.sendPatch({
            'Default:FORTStats_j': client.party.me.meta.set('Default:FORTStats_j', {
                FORTStats: {
                    fortitude: 5452,
                    offense: 5488,
                    resistance: 5483,
                    tech: 5588,
                    fortitude_Phoenix: 5152,
                    offense_Phoenix: 5418,
                    resistance_Phoenix: 5483,
                    tech_Phoenix: 5588
                }
            }),
            'Default:CampaignCommanderLoadoutRating_d': client.party.me.meta.set('Default:CampaignCommanderLoadoutRating_d', 130),
            'Default:CampaignBackpackRating_d': client.party.me.meta.set('Default:CampaignBackpackRating_d', 130),
            'Default:AthenaBannerInfo_j': client.party.me.meta.set('Default:AthenaBannerInfo_j', {
                AthenaBannerInfo: {
                    bannerIconId: "AchievementTalentedBuilder",
                    bannerColorId: "DefaultColor39",
                    seasonLevel: 200
                }
            })
        });

        await setAvailability(client, "free")
    });

    client.on('party:invite', async (req) => {

        if (isBusy) {
            await req.decline()
        } else {

            await req.accept();
            await setAvailability(client, "busy")
            timeout = setTimeout(async () => {
                client.leaveParty().catch(err => console.log(`Error: ${err}`))
                await setAvailability(client, "free")
            }, LEAVETIME)
        }
    });


    client.on('friend:request', async (req) => {
        await req.accept();
    });

    client.on('party:member:promoted', async (req) => {
        if (client.user.self.id == req.id) {
            await client.party.leave(true)
            setPrivacy(client)
            await setAvailability(client, "free")
            clearTimeout(timeout)
        }
    })

    client.on('party:member:kicked', async (req) => {
        if (client.user.self.id == req.id) {
            setPrivacy(client)
            await setAvailability(client, "free")
            clearTimeout(timeout)
        }
    })

    //client.on('party:joinrequest', async (req) => {})

    client.login();

})()