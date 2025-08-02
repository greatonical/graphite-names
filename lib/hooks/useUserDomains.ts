// lib/hooks/useUserDomains.ts
"use client";

import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { parseAbi, keccak256, toHex, getContract } from 'viem';

interface Domain {
  name: string;
  expiry: Date;
  daysLeft: number;
  node: string;
  isPrimary?: boolean;
  hasSubdomains?: boolean; // CHANGES: Added hasSubdomains property
}

const REGISTRY_ABI = parseAbi([
  'function getDomain(bytes32 node) view returns (address owner, address resolver, uint64 expiry, bytes32 parent)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function TLD_NODE() view returns (bytes32)',
  'event DomainRegistered(bytes32 indexed node, string label, address owner, uint64 expiry)',
]);

const SUBDOMAIN_ABI = parseAbi([
  'event SubdomainRegistered(bytes32 indexed node, string label, address owner, uint64 expiry)',
]);

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`;
const SUBDOMAIN_ADDRESS = process.env.NEXT_PUBLIC_SUBDOMAIN_ADDRESS as `0x${string}`;
const TLD_NODE = '0xdb6d6f1b63164285dbeecc46029ccea362278e6a391a29fb0fe4337ec0e6f5fd' as `0x${string}`;

export function useUserDomains() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [domains, setDomains] = useState<Domain[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateDaysLeft = (expiry: Date): number => {
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const generateDomainNode = (label: string, parentNode: `0x${string}` = TLD_NODE): `0x${string}` => {
    const labelHash = keccak256(toHex(label));
    return keccak256(`0x${parentNode.slice(2)}${labelHash.slice(2)}` as `0x${string}`);
  };

  // CHANGES: Added function to check if domain has subdomains
  const checkDomainHasSubdomains = async (domainNode: string): Promise<boolean> => {
    if (!publicClient) return false;

    try {
      // Check both SubdomainRegistrar events and regular Registry events
      const fromBlock = BigInt(0);
      const toBlock = 'latest';

      // Check SubdomainRegistrar events
      const subdomainLogs = await publicClient.getLogs({
        address: SUBDOMAIN_ADDRESS,
        event: {
          type: 'event',
          name: 'SubdomainRegistered',
          inputs: [
            { name: 'node', type: 'bytes32', indexed: true },
            { name: 'label', type: 'string', indexed: false },
            { name: 'owner', type: 'address', indexed: false },
            { name: 'expiry', type: 'uint64', indexed: false },
          ],
        },
        fromBlock,
        toBlock,
      });

      // Check Registry events for subdomains
      const domainLogs = await publicClient.getLogs({
        address: REGISTRY_ADDRESS,
        event: {
          type: 'event',
          name: 'DomainRegistered',
          inputs: [
            { name: 'node', type: 'bytes32', indexed: true },
            { name: 'label', type: 'string', indexed: false },
            { name: 'owner', type: 'address', indexed: false },
            { name: 'expiry', type: 'uint64', indexed: false },
          ],
        },
        fromBlock,
        toBlock,
      });

      const contract = getContract({
        address: REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        client: publicClient,
      });

      // Check subdomain events
      for (const log of subdomainLogs) {
        if (!log.args?.node) continue;
        try {
          const domainInfo = await contract.read.getDomain([log.args.node]);
          const parentNode = domainInfo[3];
          if (parentNode.toLowerCase() === domainNode.toLowerCase()) {
            return true;
          }
        } catch (err) {
          // Continue checking other logs
        }
      }

      // Check domain events for subdomains
      for (const log of domainLogs) {
        if (!log.args?.node) continue;
        try {
          const domainInfo = await contract.read.getDomain([log.args.node]);
          const parentNode = domainInfo[3];
          if (parentNode.toLowerCase() === domainNode.toLowerCase()) {
            return true;
          }
        } catch (err) {
          // Continue checking other logs
        }
      }

      return false;
    } catch (err) {
      console.error('Error checking subdomains:', err);
      return false;
    }
  };

  const fetchUserDomains = async () => {
    if (!address || !publicClient || !isConnected) {
      setDomains([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get all DomainRegistered events for this user
      const fromBlock = BigInt(0); // You might want to store this in localStorage for efficiency
      const toBlock = 'latest';

      const logs = await publicClient.getLogs({
        address: REGISTRY_ADDRESS,
        event: {
          type: 'event',
          name: 'DomainRegistered',
          inputs: [
            { name: 'node', type: 'bytes32', indexed: true },
            { name: 'label', type: 'string', indexed: false },
            { name: 'owner', type: 'address', indexed: false },
            { name: 'expiry', type: 'uint64', indexed: false },
          ],
        },
        fromBlock,
        toBlock,
      });

      // Filter logs for this user and verify current ownership
      const userDomains: Domain[] = [];
      
      for (const log of logs) {
        if (log.args?.owner?.toLowerCase() === address.toLowerCase()) {
          const node = log.args.node;
          const label = log.args.label;
          const expiry = log.args.expiry;

          if (!node || !label || !expiry) continue;

          try {
            // Verify current ownership (domain might have been transferred)
            const contract = getContract({
              address: REGISTRY_ADDRESS,
              abi: REGISTRY_ABI,
              client: publicClient,
            });

            const domainInfo = await contract.read.getDomain([node]);
            const currentOwner = domainInfo[0];

            // Only include if user still owns the domain
            if (currentOwner.toLowerCase() === address.toLowerCase()) {
              const expiryDate = new Date(Number(expiry) * 1000);
              const daysLeft = calculateDaysLeft(expiryDate);

              // CHANGES: Check if domain has subdomains
              const hasSubdomains = await checkDomainHasSubdomains(node);

              userDomains.push({
                name: `${label}.atgraphite`,
                expiry: expiryDate,
                daysLeft,
                node: node,
                isPrimary: userDomains.length === 0, // First domain is primary for now
                hasSubdomains, // CHANGES: Added hasSubdomains property
              });
            }
          } catch (err) {
            console.error(`Error checking domain ${label}:`, err);
          }
        }
      }

      // Sort by expiry date (earliest first for renewal reminders)
      userDomains.sort((a, b) => a.expiry.getTime() - b.expiry.getTime());

      setDomains(userDomains);
    } catch (err) {
      console.error('Error fetching user domains:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch domains');
      setDomains([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshDomains = () => {
    fetchUserDomains();
  };

  useEffect(() => {
    fetchUserDomains();
  }, [address, isConnected, publicClient]);

  return {
    domains,
    loading,
    error,
    refreshDomains,
  };
}