import {z} from "zod";

export const SummarizedEventSchema = z.object({
    userId : z.string().uuid(),
    sessionId : z.string(),
    source : z.enum(['agent-log','git-diff']),
    summaryText : z.string(),
    tokensIn : z.number().int().nonnegative(),
    tokensOut : z.number().int().nonnegative(),
    costUsed : z.number().nonnegative(),
    ts : z.number().int()
});

export type SummarizedEvent = z.infer<typeof SummarizedEventSchema>;