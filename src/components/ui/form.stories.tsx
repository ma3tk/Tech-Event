import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Button } from "./button";

const meta: Meta = {
  title: "UI/Form",
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj;

const schema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  bio: z
    .string()
    .min(10, "10文字以上で入力してください")
    .max(160, "160文字以内で入力してください"),
});
type Schema = z.infer<typeof schema>;

function DemoForm() {
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", bio: "" },
    mode: "onBlur",
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          alert(JSON.stringify(values, null, 2));
        })}
        className="grid w-80 gap-4"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>メールアドレス</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormDescription>連絡用のメールアドレス。</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>自己紹介</FormLabel>
              <FormControl>
                <Textarea placeholder="興味のある技術など..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">送信</Button>
      </form>
    </Form>
  );
}

export const WithValidation: Story = {
  render: () => <DemoForm />,
};
