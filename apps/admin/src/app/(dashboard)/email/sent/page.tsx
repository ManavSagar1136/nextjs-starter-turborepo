"use client";

import React, { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@buildbase/ui/components/ui/table";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { Button } from "@buildbase/ui/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@buildbase/ui/components/ui/select";
import { API } from "@/services";
import type { SentEmail } from "@/services/email";

const SentEmailsPage = () => {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchEmails = async () => {
    try {
      setIsLoading(true);
      const data = await API.email.sent.list({
        page,
        limit: 20,
        ...(statusFilter && statusFilter !== "all" && { status: statusFilter }),
      });
      setEmails(data.emails || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch sent emails:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [page, statusFilter]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      SENT: "default",
      DELIVERED: "default",
      QUEUED: "secondary",
      FAILED: "destructive",
      BOUNCED: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Send className="h-5 w-5" />
            Sent Emails
          </h1>
          <p className="text-muted-foreground mt-1">View and manage sent email history</p>
        </div>

        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="QUEUED">Queued</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="BOUNCED">Bounced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Loading sent emails...</div>
        ) : emails.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">No sent emails found.</div>
        ) : (
          <>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>To</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emails.map(email => (
                    <TableRow key={email.id}>
                      <TableCell>{email.to.join(", ")}</TableCell>
                      <TableCell>{email.from}</TableCell>
                      <TableCell className="max-w-xs truncate">{email.subject}</TableCell>
                      <TableCell>{getStatusBadge(email.status)}</TableCell>
                      <TableCell>{email.providerName}</TableCell>
                      <TableCell>{formatDate(email.sentAt || email.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground text-sm">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={page === 1}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SentEmailsPage;
