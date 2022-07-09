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
	import Blanket from './Blanket.svelte';

	import View1 from './Test/view1.svelte';
import Settings from './Test/Settings.svelte';

	let showPopup = false;
	let value = '911';

	$: showPopup, document.body.style.overflow = showPopup ? 'hidden' : 'visible' 
</script>

<!-- Panel 1: Login -->
<Flexbox width="100vw" height="100vh" align={['center', 'center']}>
	<!-- Dialog -->
	<Flexbox gap="lg" width="300px" height="fit-content" align={['center', 'center']}>
		<Textfield title="Email" instructions="Must be from gmail or yahoo" placeholder="example@gmail.com"/>
		<Textfield title="Password" placeholder="mypassword@logi7345"/>
		<Range width="100%" title="Phone number" instructions="{value}" bind:value={value} min={0} max={9999999999}/>
		<Flexbox width="100%" align={['end', 'end']} gap="sm" direction="row">
			<Button>Cancel</Button>
			<Button appearance="primary" clickHandler={() => {showPopup = true}}>Show Popup</Button>
		</Flexbox>
	</Flexbox>

	<!-- Popup -->
	{#if showPopup}
		<Blanket clickHandler={() => {showPopup = false}}>
			<Banner title="Delete this post">
				<BannerDescription>
					This will delete post <Code>h432Kkl23Jhe3</Code> and all replies permanently.
				</BannerDescription>
				<BannerActions>
					<Button appearance="link-secondary" compact clickHandler={() => {showPopup = false}}>Cancel</Button>
					<Button appearance="danger" clickHandler={() => {showPopup = false}}>Delete</Button>
				</BannerActions>
			</Banner>
		</Blanket>
	{/if}
</Flexbox>
