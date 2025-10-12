"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Coins, TrendingUp } from "lucide-react";
import type { Profile } from "@/lib/types";
import { useState } from "react";
import {
    useAccount,
    useWriteContract,
    useWaitForTransactionReceipt,
    useReadContract,
} from "wagmi";
import type { Abi, Address } from "viem";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/contract";
import { toast } from "sonner";

interface ProfileCardProps {
    profile: Profile;
    onHire?: () => void;
}

export function ProfileCard({ profile, onHire }: ProfileCardProps) {
    const { address } = useAccount();
    const [durationHours, setDurationHours] = useState("");
    const [ratePerHourU2U, setRatePerHourU2U] = useState("");
    const { writeContract, data: txHash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt(
        { hash: txHash }
    );
    const { data: u2uTokenAddress } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "u2uToken",
    } as any);

    const handleHire = async () => {
        if (!durationHours.trim() || !ratePerHourU2U.trim()) {
            toast.error("Enter duration and rate");
            return;
        }
        try {
            const duration = BigInt(durationHours); // hours
            // Rate per hour in whole U2U (frontend currently uses integers)
            const ratePerHour =
                BigInt(ratePerHourU2U) *
                (BigInt(10) *
                    BigInt(10) *
                    BigInt(10) *
                    BigInt(10) *
                    BigInt(10) *
                    BigInt(10) *
                    BigInt(10) *
                    BigInt(10) *
                    BigInt(10) *
                    BigInt(10) *
                    BigInt(10) *
                    BigInt(10) *
                    BigInt(10) *
                    BigInt(10) *
                    BigInt(10) *
                    BigInt(10) *
                    BigInt(10) *
                    BigInt(10));
            const totalCost = duration * ratePerHour;
            if (!u2uTokenAddress) {
                toast.error("U2U token not resolved");
                return;
            }
            // Approve U2U total cost first
            await writeContract({
                address: u2uTokenAddress as Address,
                abi: [
                    {
                        name: "approve",
                        type: "function",
                        stateMutability: "nonpayable",
                        inputs: [
                            { type: "address", name: "spender" },
                            { type: "uint256", name: "amount" },
                        ],
                        outputs: [{ type: "bool" }],
                    },
                ] as unknown as Abi,
                functionName: "approve",
                args: [CONTRACT_ADDRESS, totalCost],
            } as any);
            // Small delay to let wallet process approval
            await new Promise((r) => setTimeout(r, 2000));
            writeContract({
                address: CONTRACT_ADDRESS as Address,
                abi: CONTRACT_ABI as unknown as Abi,
                functionName: "hirePlayer",
                args: [profile.id, duration, ratePerHour],
            } as any);
            toast.message("Submitting hire...");
        } catch (e: any) {
            toast.error(e?.message || "Failed to hire");
        }
    };

    return (
        <Card className="bg-[#1B1B1B] border-[#00FFFF]/30 hover:border-[#FF0080]/50 transition-all neon-border overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-[#FF0080]/20 via-[#00FFFF]/20 to-[#8AFF00]/20 holographic" />

            <CardContent className="pt-0 px-6 pb-6">
                <div className="flex flex-col items-center -mt-12">
                    <Avatar className="h-24 w-24 border-4 border-[#0F0F0F] ring-2 ring-[#FF0080]">
                        <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.owner}`}
                        />
                        <AvatarFallback className="bg-[#FF0080] text-white font-orbitron">
                            {profile.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <h3 className="mt-4 font-orbitron text-xl font-bold glow-cyan">
                        {profile.name}
                    </h3>

                    <p className="text-xs text-gray-500 font-mono mt-1">
                        {profile.owner.slice(0, 6)}...{profile.owner.slice(-4)}
                    </p>

                    <div className="flex gap-2 mt-4">
                        <Badge className="bg-[#FF0080]/20 text-[#FF0080] border-[#FF0080]/50 font-orbitron">
                            <Coins className="h-3 w-3 mr-1" />
                            {profile.socialTokenBalance.toString()}
                        </Badge>
                        <Badge className="bg-[#00FFFF]/20 text-[#00FFFF] border-[#00FFFF]/50 font-orbitron">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {profile.totalEarned.toString()}
                        </Badge>
                    </div>

                    <div className="w-full mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Total Hires</span>
                            <span className="font-orbitron text-[#8AFF00]">
                                {profile.totalHires.toString()}
                            </span>
                        </div>
                    </div>

                    <div className="w-full mt-4 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                value={durationHours}
                                onChange={(e) =>
                                    setDurationHours(
                                        e.target.value.replace(/[^0-9]/g, "")
                                    )
                                }
                                placeholder="Duration (hours)"
                                className="bg-[#0F0F0F] border border-[#00FFFF]/30 rounded px-2 py-1 text-sm"
                            />
                            <input
                                value={ratePerHourU2U}
                                onChange={(e) =>
                                    setRatePerHourU2U(
                                        e.target.value.replace(/[^0-9]/g, "")
                                    )
                                }
                                placeholder="Rate/hr (U2U)"
                                className="bg-[#0F0F0F] border border-[#00FFFF]/30 rounded px-2 py-1 text-sm"
                            />
                        </div>
                        {durationHours && ratePerHourU2U ? (
                            <p className="text-xs text-gray-500">
                                Estimated total:{" "}
                                {String(
                                    BigInt(durationHours) *
                                        BigInt(ratePerHourU2U)
                                )}{" "}
                                U2U
                            </p>
                        ) : null}
                        <Button
                            onClick={onHire ? onHire : handleHire}
                            disabled={isPending || isConfirming}
                            className="w-full bg-gradient-to-r from-[#FF0080] to-[#00FFFF] hover:from-[#00FFFF] hover:to-[#8AFF00] text-white font-orbitron font-bold disabled:opacity-50"
                        >
                            <Briefcase className="h-4 w-4 mr-2" />
                            {isPending || isConfirming || !isSuccess
                                ? "HIRING..."
                                : "HIRE PLAYER"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
