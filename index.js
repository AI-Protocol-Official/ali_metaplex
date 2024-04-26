import {createUmi} from '@metaplex-foundation/umi-bundle-defaults';
import {keypairIdentity, createSignerFromKeypair} from '@metaplex-foundation/umi';
import {
	mplTokenMetadata,
	findMetadataPda,
	createMetadataAccountV3,
	updateMetadataAccountV2,
	safeFetchMetadata,
} from '@metaplex-foundation/mpl-token-metadata';
import {PublicKey} from '@solana/web3.js';
import fs from "fs";

// Use the RPC endpoint of your choice
const rpcEndpoint = 'https://api.devnet.solana.com'; // 'https://api.mainnet-beta.solana.com/';
// Create Umi Instance
const umi = createUmi(rpcEndpoint).use(mplTokenMetadata());

// Import your private key file and parse it.
const wallet = '../p_key_solana';
const secretKey = JSON.parse(fs.readFileSync(wallet, 'utf-8'));

// Create a keypair from your private key
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secretKey));
console.log("Wallet %o", keypair.publicKey);
// Register it to the Umi client.
umi.use(keypairIdentity(keypair));
// Create tx Signer from the keypair
const signer = createSignerFromKeypair(umi, keypair);

// token's mint address (token address) to update metadata for
const mintAddress = new PublicKey('3kRNNcyVmsXSLwrbTyyRoFjfscAcMzWXjs1XJYqzqFMg');

// Calculate the metadata PDA
const metadataPda = await findMetadataPda(umi, {mint: mintAddress});
console.log("metadataPDA %o", metadataPda);

// Define your token's metadata
const tokenMetadata = {
	name: "Artificial Liquid Intelligence", // maximum 32 characters
	symbol: "ALI", // maximum 8 characters
	uri: "https://raw.githubusercontent.com/AI-Protocol-Official/ali_metaplex/master/ali_metadata.json",
	sellerFeeBasisPoints: 0,
	creators: null,
	collection: null,
	uses: null,
};
console.log("tokenMetadata %o", tokenMetadata);

// Fetch token metadata Using safeFetchMetadata to see if it exists
const metadata = await safeFetchMetadata(umi, metadataPda);
if (metadata) {
	// option 1: update
	console.log("metadata exists, updating");

	// The parameters for the updateMetadataAccountV2 function
	const updateParams = {
		// UpdateMetadataAccountV2InstructionAccounts
		metadata: metadataPda,
		// UpdateMetadataAccountV2InstructionArgs
		data: tokenMetadata,
	};

	// Create the transaction (tx builder) to associate metadata with your token
	const txBuilder = updateMetadataAccountV2(umi, updateParams);
	// Send the transaction
	const {signature, result} = await txBuilder.sendAndConfirm(umi);
	console.log("token metadata updated");
	console.log("signature %o", Buffer.from(signature).toString('hex'));
	console.log("result %o", result);
}
else {
	// option 2: create
	console.log("metadata does not exist, creating");

	// The parameters for the createMetadataAccountV3 function
	const createParams = {
		// CreateMetadataAccountV3InstructionAccounts
		metadata: metadataPda,
		mint: mintAddress,
		mintAuthority: keypair.publicKey,
		// CreateMetadataAccountV3InstructionArgs
		data: tokenMetadata,
		isMutable: true,
		collectionDetails: null,
	};

	// Create the transaction (tx builder) to associate metadata with your token
	const txBuilder = createMetadataAccountV3(umi, createParams);

	// Send the transaction
	const {signature, result} = await txBuilder.sendAndConfirm(umi);
	console.log("token metadata created");
	console.log("signature %o", Buffer.from(signature).toString('hex'));
	console.log("result %o", result);
}
