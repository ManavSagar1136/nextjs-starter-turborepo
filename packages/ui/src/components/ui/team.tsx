import * as React from "react";
import { Mail, Linkedin, Twitter, Github, ExternalLink } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar?: string;
  social?: {
    email?: string;
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  };
  skills?: string[];
  location?: string;
  joinedAt?: string;
}

export interface TeamProps {
  members: TeamMember[];
  className?: string;
  variant?: "grid" | "list" | "detailed";
  showSocial?: boolean;
  showSkills?: boolean;
  showLocation?: boolean;
  showJoinDate?: boolean;
}

export function Team({
  members,
  className,
  variant = "grid",
  showSocial = true,
  showSkills = true,
  showLocation = true,
  showJoinDate = false,
}: TeamProps) {
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "linkedin":
        return <Linkedin className="h-4 w-4" />;
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "github":
        return <Github className="h-4 w-4" />;
      case "website":
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  if (variant === "list") {
    return (
      <div className={cn("space-y-4", className)}>
        {members.map(member => (
          <Card key={member.id}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className="text-lg">
                    {member.name
                      .split(" ")
                      .map(n => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <h3 className="text-lg font-semibold">{member.name}</h3>
                  <p className="text-muted-foreground">{member.role}</p>
                  <p className="text-muted-foreground line-clamp-2 text-sm">{member.bio}</p>

                  {showSkills && member.skills && member.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {member.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {member.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{member.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {showSocial && member.social && (
                  <div className="flex gap-2">
                    {Object.entries(member.social).map(([platform, url]) => (
                      <Button key={platform} variant="ghost" size="sm" asChild>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          {getSocialIcon(platform)}
                        </a>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={cn("grid grid-cols-1 gap-6 lg:grid-cols-2", className)}>
        {members.map(member => (
          <Card key={member.id}>
            <CardHeader className="text-center">
              <Avatar className="mx-auto mb-4 h-24 w-24">
                <AvatarImage src={member.avatar} />
                <AvatarFallback className="text-2xl">
                  {member.name
                    .split(" ")
                    .map(n => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{member.name}</CardTitle>
              <CardDescription className="text-base">{member.role}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-center text-sm">{member.bio}</p>

              {showLocation && member.location && (
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">📍 {member.location}</p>
                </div>
              )}

              {showJoinDate && member.joinedAt && (
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">Joined {formatJoinDate(member.joinedAt)}</p>
                </div>
              )}

              {showSkills && member.skills && member.skills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {member.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {showSocial && member.social && (
                <div className="flex justify-center gap-2">
                  {Object.entries(member.social).map(([platform, url]) => (
                    <Button key={platform} variant="ghost" size="sm" asChild>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {getSocialIcon(platform)}
                      </a>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {members.map(member => (
        <Card key={member.id} className="text-center">
          <CardHeader>
            <Avatar className="mx-auto mb-4 h-20 w-20">
              <AvatarImage src={member.avatar} />
              <AvatarFallback className="text-lg">
                {member.name
                  .split(" ")
                  .map(n => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-lg">{member.name}</CardTitle>
            <CardDescription>{member.role}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-muted-foreground line-clamp-3 text-sm">{member.bio}</p>

            {showSkills && member.skills && member.skills.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1">
                {member.skills.slice(0, 2).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {member.skills.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{member.skills.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {showSocial && member.social && (
              <div className="flex justify-center gap-2">
                {Object.entries(member.social).map(([platform, url]) => (
                  <Button key={platform} variant="ghost" size="sm" asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {getSocialIcon(platform)}
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
