
module.exports = [
  { id: 'join', points: 100, type: 'auto' },

  
  { id: 'x_follow',         points: 500, type: 'proof', meta: { url: 'https://x.com/spicenetio?s=21' } },
  { id: 'linkedin_follow',  points: 500, type: 'proof', meta: { url: 'https://www.linkedin.com/company/spicenet/' } },
  { id: 'newsletter_sub',   points: 20, type: 'proof', meta: { url: 'https://yourdomain/newsletter' } },
  { id: 'discord_join',    points: 500, type: 'proof', meta: { url: 'https://discord.gg/sTNr3pKpcN' } },

  
  { id: 'engage_post',      points: 40, type: 'proof', meta: { rateLimitPerDay: 1 } },
  { id: 'ama_question',     points: 60, type: 'proof' },


  { id: 'sepolia_faucet',   points: 15, type: 'proof', meta: { url: 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia' } },

  
  { id: 'testnet_mint',     points: 50, type: 'tx',    meta: { app: 'http://crest-fork.vercel.app' } },
  { id: 'testnet_swap',     points: 75, type: 'tx',    meta: { app: 'http://crest-fork.vercel.app' } },

  
  { id: 'testnet_feedback', points: 75, type: 'proof', meta: { form: 'https://yourdomain/forms/spiceflow-feedback' } },
];