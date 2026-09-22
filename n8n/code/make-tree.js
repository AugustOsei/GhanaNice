// Pair each uploaded blob with its path, for one tree on top of the branch's current tree.
const files = $('Make blobs').all();
const blobs = $input.all();
const tree = blobs.map((blob, index) => {
  if (!blob.json.sha) throw new Error(`GitHub did not store ${files[index].json.path}: ${JSON.stringify(blob.json).slice(0, 200)}`);
  return { path: files[index].json.path, mode: '100644', type: 'blob', sha: blob.json.sha };
});
const review = $('Prepare review').first().json;
return [{
  json: {
    tree,
    baseTree: files[0].json.baseTree,
    head: files[0].json.head,
    message: `Add listing: ${review.listing.place} (${review.regionName || 'region unknown'})\n\nApproved from a GhanaNice tip via n8n.`
  }
}];
