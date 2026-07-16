"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getDeviceId } from "@/lib/device";
import {
  acceptOnlineInvite,
  createLivePresencePayload,
  declineOnlineInvite,
  fetchIncomingInvites,
  fetchSentInvites,
  joinAcceptedOnlineInvite,
  subscribeToInviteChanges,
 