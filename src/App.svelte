<script lang="ts">
	import Badge from './Badge.svelte';
	import Banner from './Banner/Banner.svelte';
	import BannerActions from './Banner/Actions.svelte';
	import BannerDescription from './Banner/Description.svelte';
	import Button from './Button.svelte';
	import Code from './Code.svelte';
	import Flexbox from './Flexbox.svelte';
	import Range from './Range.svelte';
	import Textfield from './Textfield.svelte';
	import Tabs from './Tabs.svelte';

	let value = '911';
</script>

<!-- Window -->
<Flexbox width="100vw" height="100vh" align={['center', 'center']}>
	<!-- Dialog -->
	<Flexbox gap="lg" width="300px" height="fit-content" align={['center', 'center']}>
		<Textfield title="Email" instructions="Must be from gmail or yahoo" placeholder="example@gmail.com"/>
		<Textfield title="Password" placeholder="mypassword@logi7345"/>
		<Range width="100%" title="Phone number" instructions="{value}" bind:value={value} min={0} max={9999999999}/>
		<Flexbox width="100%" align={['end', 'end']} gap="sm" direction="row">
			<Button>Cancel</Button>
			<Button appearance="primary">Login</Button>
		</Flexbox>
	</Flexbox>
	<Banner title="Delete this post">
		<BannerDescription>
			This will delete post <Code>h432Kkl23Jhe3</Code> and all replies permanently.
		</BannerDescription>
		<BannerActions>
			<Button appearance="link-secondary" compact>Cancel</Button>
			<Button appearance="danger">Delete</Button>
		</BannerActions>
	</Banner>
</Flexbox>