import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

export const RunLimitEmail = (props: {
  runCount: number;
  runLimit: number;
  plan: string;
  upgradeUrl: string;
}) => {
  const { runCount, runLimit, plan, upgradeUrl } = props;

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>You've hit your run limit!</Preview>
        <Body className="bg-[#F6F8FA] font-sans py-[40px]">
          <Container className="bg-[#FFFFFF] mx-auto px-[32px] py-[32px] rounded-[8px] max-w-[600px]">
            <Section className="text-center mb-[32px]">
              <Img
                src="https://di867tnz6fwga.cloudfront.net/brand-kits/c71a5d43-5f15-4f8d-8823-927b2b7c4bb4/primary/c1fe68a8-ad78-4d1b-a813-a26f662de611.png"
                alt="Itzam"
                className="w-full h-auto max-w-[200px] mx-auto"
              />
            </Section>

            <Section className="mb-[32px]">
              <Text className="text-[#020304] text-[16px] leading-[24px] mb-[16px]">
                Hey there,
              </Text>

              <Text className="text-[#020304] text-[16px] leading-[24px] mb-[16px]">
                Looks like you've been busy building some amazing AI
                applications! 🔥 You've just hit the limit for your current
                plan, which means your AI apps are getting the attention they
                deserve.
              </Text>

              <Text className="text-[#020304] text-[16px] leading-[24px] mb-[24px]">
                Don't worry though - we've got you covered! It's time to level
                up and unlock more power for your AI workflows.
              </Text>

              <Section className="text-center mb-[32px]">
                <Button
                  href={upgradeUrl}
                  className="bg-[#ea580c] text-white px-[32px] py-[16px] rounded-[8px] text-[16px] font-semibold no-underline box-border"
                >
                  Upgrade
                </Button>
              </Section>
            </Section>

            <Section className="text-center mb-[32px]">
              <Text className="text-[#020304] text-[14px] leading-[20px] mb-[16px]">
                Follow us:
              </Text>
              <Section className="text-center">
                <Link
                  href="https://github.com/itzam-ai/itzam"
                  className="mx-[8px]"
                >
                  <Img
                    src="https://new.email/static/emails/social/social-github.png"
                    alt="GitHub"
                    className="w-[24px] h-[24px] inline-block"
                  />
                </Link>
                <Link href="https://discord.gg/RtqC7brGbk" className="mx-[8px]">
                  <Img
                    src="https://new.email/static/emails/social/social-discord.png"
                    alt="Discord"
                    className="w-[24px] h-[24px] inline-block"
                  />
                </Link>
                <Link href="https://x.com/itzam_ai" className="mx-[8px]">
                  <Img
                    src="https://new.email/static/emails/social/social-x.png"
                    alt="X"
                    className="w-[24px] h-[24px] inline-block"
                  />
                </Link>
                <Link
                  href="https://www.youtube.com/@itzamAI"
                  className="mx-[8px]"
                >
                  <Img
                    src="https://new.email/static/emails/social/social-youtube.png"
                    alt="YouTube"
                    className="w-[24px] h-[24px] inline-block"
                  />
                </Link>
              </Section>
            </Section>

            {/* Footer */}
            <Section className="border-t border-solid border-[#E5E7EB] pt-[24px]">
              <Text className="text-[#6B7280] text-[12px] leading-[16px] text-center m-0">
                Open source backend for AI.
              </Text>
              <Text className="text-[#6B7280] text-[12px] leading-[16px] text-center m-0">
                © {new Date().getFullYear()} Itzam. Making AI apps in minutes.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default RunLimitEmail;
