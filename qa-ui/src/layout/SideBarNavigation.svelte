<script>
	import NavigationLink from './../components/general/NavigationLink.svelte';
  let courses = [];

  const getCourses = async() => {
		const response = await fetch(`/api/courses`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json"
			}
		});

		courses = await response.json();
	}
</script>

<div class="relative border-r-2 pt-10 p-4 pl-2 pr-0 min-w-[200px] max-w-[200px]">
  <div class="sticky top-[110px]">
    <ul>
      <li>
        <NavigationLink link={"/"}>
          <svg aria-hidden="true" class="self-center" width="18" height="18" viewBox="0 0 18 18">
            <path d="M15 10v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5H0l9-9 9 9zm-8 1v6h4v-6z"/>
          </svg>
          <p class="ml-5">
            Home
          </p>
        </NavigationLink>
      </li>
      <li>
        <!-- TO DELETE, OR NOT TO DELETE - THAT IS THE QUESTION -->
        <NavigationLink link={"/"}>
          <svg class="self-center" version="1.0" width="18" height="18" viewBox="0 0 231.000000 204.000000">
            <g transform="translate(0.000000,204.000000) scale(0.100000,-0.100000)" fill="#000000" stroke="none">
              <path d="M1040 2001 c-88 -35 -955 -522 -982 -551 -60 -65 -58 -159 5 -225 33 -35 919 -531 993 -556 50 -16 158 -16 209 1 22 7 73 31 113 53 l72 41 0 70 0 70 -185 186 c-199 200 -206 211 -164 264 15 20 29 26 57 26 34 0 50 -13 244 -208 l208 -208 0 -53 c0 -46 2 -52 17 -46 68 25 604 332 630 360 63 66 65 160 5 225 -28 31 -898 518 -985 551 -62 25 -176 25 -237 0z"/>
              <path d="M330 761 c0 -92 5 -193 10 -222 24 -126 110 -236 227 -292 l68 -32 408 -3 407 -3 0 -70 c0 -73 17 -122 45 -133 34 -13 72 -6 93 17 19 20 22 35 22 104 l0 80 54 11 c159 32 286 161 316 321 13 69 13 391 0 391 -5 0 -89 -44 -187 -98 l-178 -99 -3 -261 -2 -262 -80 0 -80 0 0 215 0 214 -87 -42 c-88 -42 -88 -42 -203 -42 -138 0 -117 -9 -528 218 -155 87 -287 157 -292 157 -6 0 -10 -64 -10 -169z"/>
            </g>
          </svg>
          <p class="ml-5">
            Courses
          </p>
        </NavigationLink>
        {#await getCourses()}
          <p></p>
        {:then}
          {#if (courses.length != 0)}
            {#each courses as course}
              <li>
                <NavigationLink link={`/courses/${course.id}`}>
                  <p class="ml-5 pr-4">- {course.title}</p>
                </NavigationLink>
              </li>
            {/each}
          {/if}
        {/await}
      </li>
    </ul>
  </div>
</div>