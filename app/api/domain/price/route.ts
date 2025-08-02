// app/api/domain/price/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { graphiteMainnet } from '@/config/wagmi';

const publicClient = createPublicClient({
  chain: graphiteMainnet,
  transport: http(),
});

const REGISTRY_ABI = [
  {
    inputs: [{ name: "label", type: "string" }],
    name: "priceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

export async function POST(request: NextRequest) {
  try {
    const { label } = await request.json();

    const price = await publicClient.readContract({
      address: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`,
      abi: REGISTRY_ABI,
      functionName: 'priceOf',
      args: [label],
    });

    return NextResponse.json({ price: price.toString() });
  } catch (error) {
    console.error('Error getting price:', error);
    return NextResponse.json({ error: 'Failed to get price' }, { status: 500 });
  }
}