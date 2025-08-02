// app/api/domain/availability/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { graphiteMainnet } from '@/config/wagmi'; // Your Graphite chain config

const publicClient = createPublicClient({
  chain: graphiteMainnet,
  transport: http(),
});

const REGISTRY_ABI = [
  {
    inputs: [{ name: "node", type: "bytes32" }],
    name: "isAvailable",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

export async function POST(request: NextRequest) {
  try {
    const { node } = await request.json();

    const isAvailable = await publicClient.readContract({
      address: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`,
      abi: REGISTRY_ABI,
      functionName: 'isAvailable',
      args: [node],
    });

    return NextResponse.json({ isAvailable });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
  }
}