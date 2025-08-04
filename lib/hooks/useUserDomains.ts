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
  hasSubdomains?: boolean;
}

const REGISTRY_ABI = parseAbi([
  'function getDomain(bytes32 node) view returns (address owner, address resolver, uint64 expiry, bytes32 parent)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function TLD_NODE() view returns (bytes32)',
  'event DomainRegistered(bytes32 indexed node, string label, address indexed owner, uint64 expiry, bytes32 indexed parent)',
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

  // CHANGES: Enhanced subdomain checking with better filtering
  const checkDomainHasSubdomains = async (domainNode: string): Promise<boolean> => {
    if (!publicClient) return false;

    try {
      console.log(`🔍 Checking subdomains for domain: ${domainNode}`);
      
      const fromBlock = BigInt(0);
      const toBlock = 'latest';

      // Check SubdomainRegistrar events
      let subdomainLogs:any = [];
      try {
        subdomainLogs = await publicClient.getLogs({
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
      } catch (subErr) {
        console.log('SubdomainRegistrar events not available:', subErr);
      }

      // Check Registry events for subdomains
      const domainLogs = await publicClient.getLogs({
        address: REGISTRY_ADDRESS,
        event: {
          type: 'event',
          name: 'DomainRegistered',
          inputs: [
            { name: 'node', type: 'bytes32', indexed: true },
            { name: 'label', type: 'string', indexed: false },
            { name: 'owner', type: 'address', indexed: true },
            { name: 'expiry', type: 'uint64', indexed: false },
            { name: 'parent', type: 'bytes32', indexed: true },
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
            console.log(`✅ Found subdomain via SubdomainRegistrar for ${domainNode}`);
            return true;
          }
        } catch (err) {
          console.log(`❌ Error checking subdomain ${log.args.node}:`, err);
        }
      }

      // Check domain events for subdomains
      for (const log of domainLogs) {
        if (!log.args?.node || !log.args?.parent) continue;
        const parentNode = log.args.parent;
        if (parentNode.toLowerCase() === domainNode.toLowerCase()) {
          console.log(`✅ Found subdomain via Registry for ${domainNode}`);
          return true;
        }
      }

      console.log(`❌ No subdomains found for ${domainNode}`);
      return false;
    } catch (err) {
      console.error('Error checking subdomains:', err);
      return false;
    }
  };

  const fetchUserDomains = async () => {
    if (!address || !publicClient || !isConnected) {
      console.log('👤 No address/client/connection - clearing domains');
      setDomains([]);
      return;
    }

    console.log(`🚀 Fetching domains for address: ${address}`);
    setLoading(true);
    setError(null);

    try {
      // Get all DomainRegistered events
      const fromBlock = BigInt(0);
      const toBlock = 'latest';

      console.log(`📡 Fetching events from block ${fromBlock} to ${toBlock}`);

      const logs = await publicClient.getLogs({
        address: REGISTRY_ADDRESS,
        event: {
          type: 'event',
          name: 'DomainRegistered',
          inputs: [
            { name: 'node', type: 'bytes32', indexed: true },
            { name: 'label', type: 'string', indexed: false },
            { name: 'owner', type: 'address', indexed: true },
            { name: 'expiry', type: 'uint64', indexed: false },
            { name: 'parent', type: 'bytes32', indexed: true },
          ],
        },
        fromBlock,
        toBlock,
      });

      console.log(`📋 Found ${logs.length} total domain registration events`);

      // Filter logs for this user
      const userEvents = logs.filter(log => 
        log.args?.owner?.toLowerCase() === address.toLowerCase()
      );

      console.log(`👤 Found ${userEvents.length} events for user ${address}`);

      const userDomains: Domain[] = [];
      
      for (const log of userEvents) {
        const node = log.args?.node;
        const label = log.args?.label;
        const expiry = log.args?.expiry;
        const parent = log.args?.parent;

        if (!node || !label || !expiry) {
          console.log(`⚠️ Skipping incomplete event:`, log.args);
          continue;
        }

        console.log(`🔍 Processing domain: ${label}, parent: ${parent}, node: ${node}`);

        try {
          // Verify current ownership
          const contract = getContract({
            address: REGISTRY_ADDRESS,
            abi: REGISTRY_ABI,
            client: publicClient,
          });

          const domainInfo = await contract.read.getDomain([node]);
          const currentOwner = domainInfo[0];
          const currentExpiry = domainInfo[2];

          console.log(`🏠 Current owner of ${label}: ${currentOwner}`);
          console.log(`⏰ Current expiry of ${label}: ${currentExpiry}`);

          // Only include if user still owns the domain
          if (currentOwner.toLowerCase() === address.toLowerCase()) {
            // CHANGES: Fixed expiry handling - check if it's the permanent TLD
            let expiryDate: Date;
            let daysLeft: number;
            
            if (currentExpiry === BigInt('18446744073709551615')) { // type(uint64).max
              // Permanent domain (like the TLD)
              expiryDate = new Date('2100-01-01'); // Far future date for display
              daysLeft = 999999; // Effectively infinite
              console.log(`♾️ Domain ${label} is permanent`);
            } else {
              expiryDate = new Date(Number(currentExpiry) * 1000);
              daysLeft = calculateDaysLeft(expiryDate);
              console.log(`📅 Domain ${label} expires: ${expiryDate}, days left: ${daysLeft}`);
            }

            // Check if domain has subdomains
            const hasSubdomains = await checkDomainHasSubdomains(node);

            // CHANGES: Include ALL user domains, including TLD
            const domainName = label === 'atgraphite' ? 'atgraphite.atgraphite' : `${label}.atgraphite`;

            userDomains.push({
              name: domainName,
              expiry: expiryDate,
              daysLeft,
              node: node,
              isPrimary: userDomains.length === 0, // First domain is primary
              hasSubdomains,
            });

            console.log(`✅ Added domain: ${domainName}`);
          } else {
            console.log(`❌ User no longer owns ${label} (current owner: ${currentOwner})`);
          }
        } catch (err) {
          console.error(`❌ Error checking domain ${label}:`, err);
        }
      }

      // Sort by expiry date (permanent domains first, then by expiry)
      userDomains.sort((a, b) => {
        if (a.daysLeft === 999999 && b.daysLeft !== 999999) return -1;
        if (b.daysLeft === 999999 && a.daysLeft !== 999999) return 1;
        return a.expiry.getTime() - b.expiry.getTime();
      });

      console.log(`🎉 Final domains list:`, userDomains.map(d => d.name));
      setDomains(userDomains);
    } catch (err) {
      console.error('❌ Error fetching user domains:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch domains');
      setDomains([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshDomains = () => {
    console.log('🔄 Refreshing domains...');
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